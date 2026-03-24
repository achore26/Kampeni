"""Daily AI briefing generator.

Uses GPT-4o API for natural language generation.
Open-source models (sentiment, NER) handle the analysis upstream.
GPT-4o handles the final writing pass.

IMPORTANT: Every generated briefing must be reviewed and approved by the
Political Director before delivery to the candidate. This is the quality gate.

Delivery: 6am EAT push notification + email backup + SMS fallback.
Format: 5 sections, mobile-optimised, 2-minute read target.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class BriefingContext:
    candidate_id: str
    overnight_sentiment: dict
    opponent_activity: list[dict]
    top_issues: list[dict]
    ward_focus: dict
    language: str = "sw"  # Default: Swahili


class BriefingGenerator:
    """GPT-4o powered briefing generator. Wire up OpenAI client in Month 4."""

    SYSTEM_PROMPT = """You are a senior political intelligence analyst writing a daily
briefing for a Kenyan political candidate. Write in {language}.
Be direct, actionable, and scannable. No tables, no jargon.
Every factual claim must be attributable to a verifiable source.
The candidate is under pressure — make every word count."""

    def generate(self, context: BriefingContext) -> str:
        # TODO: call OpenAI GPT-4o API with structured context
        # Sections: Overnight Developments, Sentiment Shifts,
        #           Opponent Activity, Today's 3 Actions, Ward Focus
        raise NotImplementedError("Wire up GPT-4o in Month 4")
