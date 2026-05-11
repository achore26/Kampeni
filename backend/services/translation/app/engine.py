"""Translation engine — wraps the Tarjumi API (api.thexi.dev).

Tarjumi is a neural machine translation API fine-tuned on 9.4M African
language pairs. It supports Swahili, Kikuyu, Luo, Kamba, and 12 more.

When TARJUMI_API_KEY is set in .env, all calls go to the real API.
When blank, the engine falls back to langdetect (less accurate on African
languages but keeps the pipeline running during development).

Endpoints used:
  POST /v1/detect    — detect language of a piece of text
  POST /v1/translate — translate a single piece of text
  POST /v1/batch     — translate up to 100 items in one request (parallel)
  POST /v1/keywords  — get multilingual keyword translations for a concept
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from .config import get_settings, TARJUMI_BASE_URL

logger = logging.getLogger(__name__)

# Languages that are already understood natively — no translation needed
SUPPORTED_LANGUAGES = {"en", "sw"}

# Map Tarjumi quality strings to a 0–1 confidence float
_QUALITY_MAP = {"high": 0.92, "medium": 0.70, "low": 0.45}


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
        return bool(self._settings.tarjumi_api_key)

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._settings.tarjumi_api_key}",
            "Content-Type": "application/json",
        }

    # ── Language Detection ────────────────────────────────────────────────────

    def detect(self, text: str) -> DetectionResult:
        """Detect the language of text using Tarjumi /v1/detect.

        Tarjumi is significantly more accurate than langdetect on African
        languages — it correctly distinguishes Kikuyu from English, Luo from
        Swahili, etc. Falls back to langdetect if API key not set.
        """
        if self._api_ready:
            try:
                with httpx.Client(timeout=5.0) as client:
                    r = client.post(
                        f"{TARJUMI_BASE_URL}/v1/detect",
                        json={"text": text},
                        headers=self._headers(),
                    )
                    r.raise_for_status()
                    d = r.json()
                    # Tarjumi returns: primary_language, confidence, is_mixed,
                    # languages_detected (list of {language, confidence} objects)
                    return DetectionResult(
                        language=d["primary_language"],
                        confidence=d["confidence"],
                        mixed=d.get("is_mixed", False),
                        languages_detected=[
                            item["language"]
                            for item in d.get("languages_detected", [])
                        ],
                    )
            except Exception as exc:
                logger.warning("Tarjumi /v1/detect failed: %s — falling back to langdetect", exc)

        return self._mock_detect(text)

    def _mock_detect(self, text: str) -> DetectionResult:
        """Fallback: use langdetect. Less accurate on African languages."""
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

    # ── Single Translation ────────────────────────────────────────────────────

    def translate(self, text: str, source_language: str, target_language: str = "en") -> TranslationResult:
        """Translate a single piece of text via Tarjumi /v1/translate."""
        if source_language in SUPPORTED_LANGUAGES or source_language == target_language:
            return TranslationResult(
                original=text,
                translated=text,
                source_language=source_language,
                confidence=1.0,
            )

        if self._api_ready:
            try:
                with httpx.Client(timeout=10.0) as client:
                    r = client.post(
                        f"{TARJUMI_BASE_URL}/v1/translate",
                        json={
                            "text": text,
                            "target_language": target_language,
                            "source_language": source_language,
                        },
                        headers=self._headers(),
                    )
                    r.raise_for_status()
                    d = r.json()
                    # Tarjumi returns: translation (not "translated"), quality string
                    return TranslationResult(
                        original=text,
                        translated=d["translation"],
                        source_language=source_language,
                        confidence=_QUALITY_MAP.get(d.get("quality", "medium"), 0.70),
                    )
            except Exception as exc:
                logger.warning("Tarjumi /v1/translate failed: %s — falling back to mock", exc)

        return self._mock_translate(text, source_language)

    def _mock_translate(self, text: str, source_language: str) -> TranslationResult:
        """Pass text through unchanged. used_mock=True flags downstream for deprioritisation."""
        logger.info("Mock translation: language=%s — text passed through unchanged", source_language)
        return TranslationResult(
            original=text,
            translated=text,
            source_language=source_language,
            confidence=0.0,
            used_mock=True,
        )

    # ── Batch Translation ─────────────────────────────────────────────────────

    def batch_translate(self, texts: list[str], target_language: str = "en") -> list[TranslationResult]:
        """Translate up to 100 texts in a single Tarjumi /v1/batch call.

        Tarjumi processes batch items in parallel — much faster and cheaper
        on rate limits than calling /v1/translate once per article.

        Note: source_language is intentionally omitted so Tarjumi auto-detects
        per item. This handles mixed-language batches correctly.
        """
        if self._api_ready:
            try:
                # Tarjumi batch format: items array with id + text per item
                items = [{"id": str(i), "text": t} for i, t in enumerate(texts)]
                with httpx.Client(timeout=30.0) as client:
                    r = client.post(
                        f"{TARJUMI_BASE_URL}/v1/batch",
                        json={"items": items, "target_language": target_language},
                        headers=self._headers(),
                    )
                    r.raise_for_status()
                    results = r.json()["results"]
                    # Tarjumi returns: id, detected_language, translated
                    return [
                        TranslationResult(
                            original=texts[int(item["id"])],
                            translated=item["translated"],
                            source_language=item.get("detected_language", "unknown"),
                            confidence=0.85,  # batch doesn't return per-item quality
                        )
                        for item in results
                    ]
            except Exception as exc:
                logger.warning("Tarjumi /v1/batch failed: %s — falling back to per-item mock", exc)

        return [self._mock_translate(t, "unknown") for t in texts]

    # ── Keyword Expansion ─────────────────────────────────────────────────────

    def get_keywords(self, concept: str, target_languages: list[str]) -> dict[str, list[str]]:
        """Get multilingual keyword translations for a political concept.

        Example: concept="water shortage", target_languages=["sw", "luo", "ki"]
        Returns: {"sw": ["ukosefu wa maji", "maji"], "luo": ["pi ok"], "ki": ["maaî"]}

        Used by the pain point extractor to scan articles in any Kenyan language.
        Tarjumi returns both formal and colloquial terms — we combine both.
        """
        if self._api_ready:
            try:
                with httpx.Client(timeout=10.0) as client:
                    r = client.post(
                        f"{TARJUMI_BASE_URL}/v1/keywords",
                        json={
                            "concept": concept,
                            "target_languages": target_languages,
                            "include_colloquial": True,
                        },
                        headers=self._headers(),
                    )
                    r.raise_for_status()
                    # Tarjumi returns: translations.{lang}.formal, translations.{lang}.colloquial
                    raw = r.json().get("translations", {})
                    return {
                        lang: data.get("formal", []) + data.get("colloquial", [])
                        for lang, data in raw.items()
                    }
            except Exception as exc:
                logger.warning("Tarjumi /v1/keywords failed: %s — returning empty", exc)

        return {lang: [concept] for lang in target_languages}
