"""Swahili ↔ English translation using Helsinki-NLP opus-mt-en-sw.

Base model: Helsinki-NLP/opus-mt-en-sw
Fine-tuning target: Kenyan political corpus (Hansard + local news + social media).
"""


class SwahiliTranslator:
    """Helsinki-NLP based translator. Wire up during Month 2."""

    def translate_to_english(self, text: str) -> str:
        # TODO: load Helsinki-NLP/opus-mt-sw-en and run inference
        raise NotImplementedError

    def translate_to_swahili(self, text: str) -> str:
        # TODO: load Helsinki-NLP/opus-mt-en-sw and run inference
        raise NotImplementedError

    def detect_language(self, text: str) -> str:
        """Returns: 'en', 'sw', or 'sheng'."""
        # TODO: langdetect + Sheng heuristics
        raise NotImplementedError
