"""Translation engine — wraps the external language API.

When translation_api_url is set in config, calls the real API.
When blank, uses the mock implementation so the pipeline keeps running.

The external API contract (what the other engineer must implement):

POST /detect
  body:  { "text": "..." }
  resp:  { "language": "luo", "confidence": 0.92, "mixed": true,
            "languages_detected": ["luo", "en"] }

POST /translate
  body:  { "text": "...", "source_language": "luo", "target_language": "en" }
  resp:  { "original": "...", "translated": "...", "confidence": 0.87 }

POST /keywords
  body:  { "topic": "water shortage",
            "target_languages": ["sw", "luo", "kik", "sheng"] }
  resp:  { "keywords": { "sw": [...], "luo": [...], ... } }

POST /batch
  body:  { "texts": [...], "operation": "translate", "target_language": "en" }
  resp:  { "results": [ { "original": "...", "translated": "...",
                           "language": "luo", "confidence": 0.87 }, ... ] }
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from .config import get_settings

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {"en", "sw"}  # languages that don't need translation


@dataclass
class DetectionResult:
    language: str
    confidence: float
    mixed: bool
    languages_detected: list[str]


@dataclass
class TranslationResult:
    original: str
    translated: str
    source_language: str
    confidence: float
    used_mock: bool = False


class TranslationEngine:

    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def _api_ready(self) -> bool:
        return bool(self._settings.translation_api_url)

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._settings.translation_api_key}",
            "Content-Type": "application/json",
        }

    def _base(self) -> str:
        return self._settings.translation_api_url.rstrip("/")

    # ── Detection ─────────────────────────────────────────────────────────────

    def detect(self, text: str) -> DetectionResult:
        if self._api_ready:
            try:
                with httpx.Client(timeout=5.0) as client:
                    r = client.post(
                        f"{self._base()}/detect",
                        json={"text": text},
                        headers=self._headers(),
                    )
                    r.raise_for_status()
                    d = r.json()
                    return DetectionResult(
                        language=d["language"],
                        confidence=d["confidence"],
                        mixed=d.get("mixed", False),
                        languages_detected=d.get("languages_detected", [d["language"]]),
                    )
            except Exception as exc:
                logger.warning("Translation API detect failed: %s — falling back to mock", exc)

        return self._mock_detect(text)

    def _mock_detect(self, text: str) -> DetectionResult:
        """Fallback: use langdetect locally."""
        try:
            from langdetect import detect
            lang = detect(text) if text and len(text.strip()) > 15 else "en"
        except Exception:
            lang = "en"
        return DetectionResult(
            language=lang,
            confidence=0.75,
            mixed=False,
            languages_detected=[lang],
        )

    # ── Translation ───────────────────────────────────────────────────────────

    def translate(self, text: str, source_language: str, target_language: str = "en") -> TranslationResult:
        if source_language in SUPPORTED_LANGUAGES or source_language == target_language:
            return TranslationResult(
                original=text,
                translated=text,
                source_language=source_language,
                confidence=1.0,
                used_mock=False,
            )

        if self._api_ready:
            try:
                with httpx.Client(timeout=10.0) as client:
                    r = client.post(
                        f"{self._base()}/translate",
                        json={
                            "text": text,
                            "source_language": source_language,
                            "target_language": target_language,
                        },
                        headers=self._headers(),
                    )
                    r.raise_for_status()
                    d = r.json()
                    return TranslationResult(
                        original=text,
                        translated=d["translated"],
                        source_language=source_language,
                        confidence=d.get("confidence", 0.0),
                        used_mock=False,
                    )
            except Exception as exc:
                logger.warning("Translation API translate failed: %s — falling back to mock", exc)

        return self._mock_translate(text, source_language)

    def _mock_translate(self, text: str, source_language: str) -> TranslationResult:
        """
        Mock translation — passes text through unchanged and flags it.
        The downstream pain point engine will see used_mock=True and can
        deprioritize or queue for manual review.
        """
        logger.info("Mock translation for language=%s — text passed through unchanged", source_language)
        return TranslationResult(
            original=text,
            translated=text,
            source_language=source_language,
            confidence=0.0,
            used_mock=True,
        )

    # ── Batch ─────────────────────────────────────────────────────────────────

    def batch_translate(self, texts: list[str], source_language: str) -> list[TranslationResult]:
        """Translate a batch. Uses batch endpoint if available, falls back to per-item."""
        if source_language in SUPPORTED_LANGUAGES:
            return [
                TranslationResult(original=t, translated=t, source_language=source_language, confidence=1.0)
                for t in texts
            ]

        if self._api_ready:
            try:
                with httpx.Client(timeout=30.0) as client:
                    r = client.post(
                        f"{self._base()}/batch",
                        json={"texts": texts, "operation": "translate", "target_language": "en"},
                        headers=self._headers(),
                    )
                    r.raise_for_status()
                    results = r.json()["results"]
                    return [
                        TranslationResult(
                            original=item["original"],
                            translated=item["translated"],
                            source_language=item.get("language", source_language),
                            confidence=item.get("confidence", 0.0),
                        )
                        for item in results
                    ]
            except Exception as exc:
                logger.warning("Batch translate failed: %s — falling back to per-item mock", exc)

        return [self._mock_translate(t, source_language) for t in texts]

    # ── Keywords ──────────────────────────────────────────────────────────────

    def get_keywords(self, topic: str, target_languages: list[str]) -> dict[str, list[str]]:
        """Translate a search topic into keywords across multiple languages."""
        if self._api_ready:
            try:
                with httpx.Client(timeout=10.0) as client:
                    r = client.post(
                        f"{self._base()}/keywords",
                        json={"topic": topic, "target_languages": target_languages},
                        headers=self._headers(),
                    )
                    r.raise_for_status()
                    return r.json()["keywords"]
            except Exception as exc:
                logger.warning("Keywords API failed: %s — returning empty", exc)

        # Mock: return the English topic for all languages
        return {lang: [topic] for lang in target_languages}
