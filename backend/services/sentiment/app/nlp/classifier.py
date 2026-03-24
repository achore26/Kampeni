"""Sentiment classifier — Swahili + English + Sheng.

MVP: VADER (English) + keyword scoring (Swahili).
Month 2 upgrade: Helsinki-NLP translation + fine-tuned Llama 3.1 8B.
"""
from __future__ import annotations

from dataclasses import dataclass

_SW_POSITIVE = {
    "nzuri", "vizuri", "furaha", "mafanikio", "matumaini", "sawa", "pongezi",
    "hongera", "ushindi", "amani", "maendeleo", "imara", "salama", "nguvu",
}
_SW_NEGATIVE = {
    "mbaya", "tatizo", "hasira", "vita", "uongo", "ufisadi", "aibu", "huzuni",
    "dhuluma", "rushwa", "fedheha", "hatari", "upotovu", "ghadhabu", "adui",
}


@dataclass
class ClassificationResult:
    label: str    # "positive" | "negative" | "neutral"
    score: float  # -1.0 to 1.0
    language: str # "en" | "sw"


class SentimentClassifier:
    def __init__(self) -> None:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        self._vader = SentimentIntensityAnalyzer()

    def _detect_language(self, text: str) -> str:
        try:
            from langdetect import detect
            return "sw" if detect(text) == "sw" else "en"
        except Exception:
            return "en"

    def _score_swahili(self, text: str) -> float:
        words = set(text.lower().split())
        pos = len(words & _SW_POSITIVE)
        neg = len(words & _SW_NEGATIVE)
        total = pos + neg
        return 0.0 if total == 0 else (pos - neg) / total

    def classify(self, text: str) -> ClassificationResult:
        if not text or not text.strip():
            return ClassificationResult(label="neutral", score=0.0, language="en")

        language = self._detect_language(text)
        score = (
            self._score_swahili(text)
            if language == "sw"
            else self._vader.polarity_scores(text)["compound"]
        )

        label = "positive" if score >= 0.05 else "negative" if score <= -0.05 else "neutral"
        return ClassificationResult(label=label, score=score, language=language)
