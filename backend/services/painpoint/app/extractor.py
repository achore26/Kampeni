"""Pain point extraction engine.

Extracts structured political issues from translated article text.

When OPENAI_API_KEY / ANTHROPIC_API_KEY is not set, uses a keyword-based
rule engine so the pipeline keeps running in development.

Real API contract (Claude / GPT):
  Prompt returns JSON:
  {
    "issues": [
      {
        "category": "water",
        "description": "Residents of Kibra lack clean water for 3 weeks",
        "severity": "high",
        "location_name": "Kibra",
        "county": "Nairobi",
        "constituency": "Kibra",
        "politicians_mentioned": ["Odinga"],
        "confidence": 0.91
      }
    ]
  }
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field

import httpx

from .config import get_settings

logger = logging.getLogger(__name__)

# ── Kenya county list for location extraction ───────────────────────────────
KENYA_COUNTIES = [
    "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta",
    "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru",
    "Tharaka Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua",
    "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
    "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo Marakwet", "Nandi",
    "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho",
    "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya",
    "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi",
]

ISSUE_KEYWORDS: dict[str, list[str]] = {
    # Each list covers: English + Swahili + Kikuyu (ki) + Luo (luo) + Kamba (kam)
    # Tarjumi /v1/keywords is used at runtime to extend these for other languages
    "water": [
        "water", "maji", "drought", "ukame", "taps", "borehole", "irrigation",
        "maaî", "mũgũnda wa maaî",      # Kikuyu
        "pi", "pi ok",                   # Luo
        "maa", "nzeve ya maa",           # Kamba
    ],
    "roads": [
        "road", "barabara", "tarmac", "potholes", "bridge", "daraja",
        "njira", "ũũndũ wa njira",       # Kikuyu
        "yo", "yo maradha",              # Luo
        "nzila", "nzila mbii",           # Kamba
    ],
    "health": [
        "hospital", "clinic", "health", "afya", "medicine", "dawa", "doctor",
        "ūgwati", "itura",               # Kikuyu
        "jomruok", "yweyo",              # Luo
        "ūvoo", "ivia",                  # Kamba
    ],
    "security": [
        "crime", "robbery", "usalama", "police", "gang", "bandit",
        "ūgaaĩ", "thirikari",            # Kikuyu
        "teko", "loch",                  # Luo
        "ūseo", "askai",                 # Kamba
    ],
    "education": [
        "school", "shule", "teacher", "mwalimu", "fees", "ada", "exam",
        "ũhoti", "mwarimu",              # Kikuyu
        "puonj", "japuonj",              # Luo
        "ūsomo", "mwalimu",              # Kamba
    ],
    "economy": [
        "jobs", "kazi", "unemployment", "business", "biashara", "poverty", "umaskini",
        "wĩra", "ūhoro wa wĩra",         # Kikuyu
        "tich", "dhier",                 # Luo
        "musyi", "ūndũ wa kũseo",        # Kamba
    ],
    "land": [
        "land", "ardhi", "eviction", "title deed", "grabbing",
        "mũgũnda", "gũtwarwo",           # Kikuyu
        "lowo", "gonyo",                 # Luo
        "ithĩ", "kũnyĩĩtwa",            # Kamba
    ],
    "electricity": [
        "power", "umeme", "electricity", "blackout", "solar",
        "ũmeme",                         # Kikuyu (borrowed)
        "taya",                          # Luo
        "ūmeme",                         # Kamba (borrowed)
    ],
    "food": [
        "food", "chakula", "hunger", "njaa", "famine", "baa la njaa",
        "irio", "njĩra",                 # Kikuyu
        "chiemo", "kech",                # Luo
        "iĩ", "nzala",                   # Kamba
    ],
    "corruption": [
        "corruption", "ufisadi", "bribe", "rushwa", "embezzle",
        "ũkoru", "gĩthũngũ",            # Kikuyu
        "mibadhi", "ruka",               # Luo
        "ūkoru", "kũibia",               # Kamba
    ],
}

SEVERITY_HIGH = ["no", "zero", "lack", "crisis", "emergency", "acute", "severe", "dead", "died"]
SEVERITY_LOW = ["minor", "slight", "small", "few"]


@dataclass
class ExtractedIssue:
    category: str
    description: str
    severity: str
    location_name: str | None
    county: str | None
    constituency: str | None
    politicians_mentioned: list[str]
    confidence: float
    used_mock: bool = False


@dataclass
class ExtractionResult:
    issues: list[ExtractedIssue] = field(default_factory=list)
    used_mock: bool = False


class PainPointExtractor:

    def __init__(self) -> None:
        self._settings = get_settings()
        # Cache enriched keyword sets per language so we only call Tarjumi once
        # per language per process lifetime (saves rate limit quota)
        self._keyword_cache: dict[str, dict[str, list[str]]] = {}

    @property
    def _api_ready(self) -> bool:
        return bool(self._settings.anthropic_api_key)

    def _keywords_for_language(self, language: str) -> dict[str, list[str]]:
        """Return issue keywords enriched for a specific language via Tarjumi.

        For English and Swahili the static ISSUE_KEYWORDS are sufficient.
        For Kikuyu, Luo, Kamba etc., we call Tarjumi /v1/keywords once and
        cache the result so we don't burn quota on every article.
        """
        if language in ("en", "sw") or not self._settings.tarjumi_api_key:
            return ISSUE_KEYWORDS

        if language in self._keyword_cache:
            return self._keyword_cache[language]

        enriched: dict[str, list[str]] = {}
        try:
            with httpx.Client(timeout=10.0) as client:
                for category in ISSUE_KEYWORDS:
                    r = client.post(
                        "https://api.thexi.dev/v1/keywords",
                        json={
                            "concept": category,
                            "target_languages": [language],
                            "include_colloquial": True,
                        },
                        headers={"Authorization": f"Bearer {self._settings.tarjumi_api_key}"},
                    )
                    if r.status_code == 200:
                        translations = r.json().get("translations", {})
                        lang_data = translations.get(language, {})
                        extra = lang_data.get("formal", []) + lang_data.get("colloquial", [])
                        enriched[category] = ISSUE_KEYWORDS[category] + extra
                    else:
                        enriched[category] = ISSUE_KEYWORDS[category]
        except Exception as exc:
            logger.warning("Tarjumi keyword enrichment failed for lang=%s: %s", language, exc)
            return ISSUE_KEYWORDS

        self._keyword_cache[language] = enriched
        logger.info("Cached Tarjumi keyword enrichment for language=%s", language)
        return enriched

    def extract(self, title: str, content: str, source_language: str = "en") -> ExtractionResult:
        text = f"{title}. {content}"
        if self._api_ready:
            try:
                return self._extract_via_claude(text)
            except Exception as exc:
                logger.warning("Claude extraction failed: %s — falling back to rule engine", exc)
        return self._rule_extract(text, source_language)

    def _extract_via_claude(self, text: str) -> ExtractionResult:
        prompt = (
            "You are a Kenyan political intelligence analyst. "
            "Extract all citizen pain points from the article below.\n\n"
            "Return ONLY valid JSON with this structure:\n"
            '{"issues": [{"category": "...", "description": "...", "severity": "low|medium|high", '
            '"location_name": "...", "county": "...", "constituency": "...", '
            '"politicians_mentioned": [...], "confidence": 0.0-1.0}]}\n\n'
            f"Article:\n{text[:3000]}"
        )
        with httpx.Client(timeout=20.0) as client:
            r = client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self._settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 1024,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            r.raise_for_status()
            raw = r.json()["content"][0]["text"]

        # Extract JSON block from response
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON found in Claude response")

        data = json.loads(match.group())
        issues = []
        for item in data.get("issues", []):
            issues.append(ExtractedIssue(
                category=item.get("category", "general"),
                description=item.get("description", ""),
                severity=item.get("severity", "medium"),
                location_name=item.get("location_name"),
                county=item.get("county"),
                constituency=item.get("constituency"),
                politicians_mentioned=item.get("politicians_mentioned", []),
                confidence=float(item.get("confidence", 0.8)),
                used_mock=False,
            ))
        return ExtractionResult(issues=issues, used_mock=False)

    def _rule_extract(self, text: str, source_language: str = "en") -> ExtractionResult:
        """Keyword-based fallback. Uses Tarjumi-enriched keywords for non-English articles."""
        text_lower = text.lower()
        issues: list[ExtractedIssue] = []

        # Detect county
        county = next((c for c in KENYA_COUNTIES if c.lower() in text_lower), None)

        # Use language-enriched keywords if the article is in Kikuyu, Luo, Kamba etc.
        keywords_map = self._keywords_for_language(source_language)

        for category, keywords in keywords_map.items():
            if not any(kw in text_lower for kw in keywords):
                continue

            severity = "medium"
            if any(w in text_lower for w in SEVERITY_HIGH):
                severity = "high"
            elif any(w in text_lower for w in SEVERITY_LOW):
                severity = "low"

            # Grab first 200 chars of relevant sentence
            description = text[:200].strip()

            issues.append(ExtractedIssue(
                category=category,
                description=description,
                severity=severity,
                location_name=county,
                county=county,
                constituency=None,
                politicians_mentioned=[],
                confidence=0.45,
                used_mock=True,
            ))
            break  # one issue per article in mock mode — avoid noise

        if not issues:
            # Always produce at least one record so the article isn't silently dropped
            issues.append(ExtractedIssue(
                category="general",
                description=text[:200].strip(),
                severity="low",
                location_name=county,
                county=county,
                constituency=None,
                politicians_mentioned=[],
                confidence=0.2,
                used_mock=True,
            ))

        return ExtractionResult(issues=issues, used_mock=True)
