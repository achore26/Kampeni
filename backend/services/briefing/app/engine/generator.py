"""Daily AI briefing generator — GPT-4o powered.

Data flow:
  1. Query Postgres for overnight (last 24h) data:
       - Sentiment summary + top articles
       - Opponent mentions
       - Top pain points
  2. Build structured context JSON
  3. Call GPT-4o with a tightly-scoped prompt
  4. Parse 5-section response
  5. Return BriefingResult

Delivery (handled by tasks.py):
  - 6am EAT push notification (future: FCM)
  - SMS fallback via Africa's Talking
  - Political Director must approve before delivery (is_approved gate)

If OPENAI_API_KEY is not set, returns a clearly-labelled placeholder briefing
so the pipeline doesn't break during development.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import create_engine, func, select, text
from sqlalchemy.orm import Session, sessionmaker

from shared.models import Article, Briefing, OpponentMention, OpponentProfile, PainPoint, SentimentRecord
from ..config import get_settings

logger = logging.getLogger(__name__)

SECTIONS_SW = [
    "Maendeleo ya Usiku",       # Overnight Developments
    "Hisia za Wananchi",         # Public Sentiment
    "Shughuli za Washindani",    # Opponent Activity
    "Vitendo 3 vya Leo",         # Today's 3 Actions
    "Mwelekeo wa Kata",          # Ward Focus
]
SECTIONS_EN = [
    "Overnight Developments",
    "Public Sentiment",
    "Opponent Activity",
    "Today's 3 Actions",
    "Ward Focus",
]

SYSTEM_PROMPT = """You are a senior political intelligence analyst writing a daily briefing
for a Kenyan political candidate. Write in {language_label}.

Rules:
- Be direct, actionable, and scannable. 2-minute read max.
- No tables, no markdown headers, no jargon.
- Every factual claim must reference the data provided.
- Use exact numbers from the data — do not invent statistics.
- Reserve urgent language for genuinely urgent items.
- The candidate is under pressure. Make every word count.

Return ONLY a JSON object with this structure:
{{
  "sections": [
    {{"title": "{s0}", "content": "..."}},
    {{"title": "{s1}", "content": "..."}},
    {{"title": "{s2}", "content": "..."}},
    {{"title": "{s3}", "content": "..."}},
    {{"title": "{s4}", "content": "..."}}
  ]
}}"""


@dataclass
class BriefingResult:
    candidate_id: str
    briefing_date: date
    language: str
    sections: list[dict]
    raw_context: dict
    used_mock: bool = False


class BriefingGenerator:

    def __init__(self) -> None:
        self._settings = get_settings()
        engine = create_engine(self._settings.postgres_dsn_sync, pool_pre_ping=True)
        self._Session = sessionmaker(bind=engine)

    def generate(self, candidate_id: str, language: str = "sw") -> BriefingResult:
        """Generate a briefing for one candidate. Uses GPT-4o or mock fallback."""
        context = self._build_context(candidate_id)
        briefing_date = datetime.now(timezone.utc).date()

        if not self._settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not set — returning mock briefing")
            return self._mock_briefing(candidate_id, briefing_date, language, context)

        try:
            sections = self._call_gpt4o(context, language)
            return BriefingResult(
                candidate_id=candidate_id,
                briefing_date=briefing_date,
                language=language,
                sections=sections,
                raw_context=context,
                used_mock=False,
            )
        except Exception as exc:
            logger.error("GPT-4o briefing generation failed: %s — falling back to mock", exc)
            return self._mock_briefing(candidate_id, briefing_date, language, context)

    def _build_context(self, candidate_id: str) -> dict:
        """Query Postgres for overnight data and return a structured context dict."""
        since = datetime.now(timezone.utc) - timedelta(hours=24)

        with self._Session() as db:
            # ── Sentiment summary ─────────────────────────────────────────────
            sentiment_rows = (
                db.query(SentimentRecord.label, func.count(SentimentRecord.id))
                .filter(SentimentRecord.created_at >= since)
                .group_by(SentimentRecord.label)
                .all()
            )
            sentiment = {row[0]: row[1] for row in sentiment_rows}
            total = sum(sentiment.values())

            # Top 5 articles by sentiment score (most positive + most negative)
            top_articles_q = (
                db.query(Article.title, Article.source, Article.url, SentimentRecord.label, SentimentRecord.score)
                .join(SentimentRecord, SentimentRecord.article_id == Article.id)
                .filter(SentimentRecord.created_at >= since)
                .order_by(func.abs(SentimentRecord.score).desc())
                .limit(5)
                .all()
            )
            top_articles = [
                {"title": r[0], "source": r[1], "label": r[3], "score": r[4]}
                for r in top_articles_q
            ]

            # ── Opponent activity ─────────────────────────────────────────────
            opp_rows = (
                db.query(OpponentProfile.name, OpponentProfile.constituency, func.count(OpponentMention.id))
                .outerjoin(OpponentMention, (
                    OpponentMention.opponent_id == OpponentProfile.id
                ) & (OpponentMention.created_at >= since))
                .filter(OpponentProfile.candidate_id == candidate_id)
                .group_by(OpponentProfile.id)
                .order_by(func.count(OpponentMention.id).desc())
                .limit(5)
                .all()
            )
            opponents = [
                {"name": r[0], "constituency": r[1], "mentions_24h": r[2]}
                for r in opp_rows
            ]

            # Most recent mention contexts for top opponent
            recent_mentions: list[dict] = []
            if opp_rows:
                top_opp = opp_rows[0]
                top_opp_profile = (
                    db.query(OpponentProfile)
                    .filter(OpponentProfile.name == top_opp[0])
                    .first()
                )
                if top_opp_profile:
                    mention_rows = (
                        db.query(OpponentMention.context, Article.source)
                        .join(Article, Article.id == OpponentMention.article_id)
                        .filter(
                            OpponentMention.opponent_id == top_opp_profile.id,
                            OpponentMention.created_at >= since,
                        )
                        .limit(3)
                        .all()
                    )
                    recent_mentions = [{"context": r[0], "source": r[1]} for r in mention_rows]

            # ── Pain points ───────────────────────────────────────────────────
            painpoint_rows = (
                db.query(
                    PainPoint.issue_category,
                    PainPoint.issue_description,
                    PainPoint.severity,
                    PainPoint.county,
                )
                .filter(PainPoint.created_at >= since)
                .order_by(
                    func.case(
                        (PainPoint.severity == "high", 0),
                        (PainPoint.severity == "medium", 1),
                        else_=2
                    ),
                    PainPoint.created_at.desc()
                )
                .limit(5)
                .all()
            )
            painpoints = [
                {"category": r[0], "description": r[1][:200], "severity": r[2], "county": r[3]}
                for r in painpoint_rows
            ]

        return {
            "date": datetime.now(timezone.utc).strftime("%A, %d %B %Y"),
            "candidate_id": candidate_id,
            "sentiment": {
                "positive": sentiment.get("positive", 0),
                "negative": sentiment.get("negative", 0),
                "neutral": sentiment.get("neutral", 0),
                "total": total,
                "positive_pct": round(sentiment.get("positive", 0) / max(total, 1) * 100),
                "negative_pct": round(sentiment.get("negative", 0) / max(total, 1) * 100),
            },
            "top_articles": top_articles,
            "opponents": opponents,
            "top_opponent_mentions": recent_mentions,
            "painpoints": painpoints,
        }

    def _call_gpt4o(self, context: dict, language: str) -> list[dict]:
        from openai import OpenAI
        client = OpenAI(api_key=self._settings.openai_api_key)

        sections = SECTIONS_SW if language == "sw" else SECTIONS_EN
        lang_label = "Kiswahili" if language == "sw" else "English"

        system = SYSTEM_PROMPT.format(
            language_label=lang_label,
            s0=sections[0], s1=sections[1], s2=sections[2],
            s3=sections[3], s4=sections[4],
        )
        user_msg = f"Here is today's intelligence data:\n\n{json.dumps(context, ensure_ascii=False, indent=2)}"

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        return data.get("sections", [])

    def _mock_briefing(
        self,
        candidate_id: str,
        briefing_date: date,
        language: str,
        context: dict,
    ) -> BriefingResult:
        """Placeholder briefing when OpenAI key is not configured."""
        s = context.get("sentiment", {})
        sections = [
            {
                "title": "Maendeleo ya Usiku" if language == "sw" else "Overnight Developments",
                "content": (
                    f"Makala {s.get('total', 0)} zilizochunguzwa. "
                    f"Hisia {s.get('positive_pct', 0)}% chanya, {s.get('negative_pct', 0)}% hasi."
                    if language == "sw"
                    else f"{s.get('total', 0)} articles analysed overnight. "
                    f"Sentiment: {s.get('positive_pct', 0)}% positive, {s.get('negative_pct', 0)}% negative."
                ),
            },
            {
                "title": "Hisia za Wananchi" if language == "sw" else "Public Sentiment",
                "content": "[Inazalishwa na AI — OPENAI_API_KEY haijakonfigurwa]"
                if language == "sw"
                else "[AI generation pending — OPENAI_API_KEY not configured]",
            },
            {
                "title": "Shughuli za Washindani" if language == "sw" else "Opponent Activity",
                "content": f"{len(context.get('opponents', []))} washindani wanafuatiliwa."
                if language == "sw"
                else f"{len(context.get('opponents', []))} opponents monitored.",
            },
            {
                "title": "Vitendo 3 vya Leo" if language == "sw" else "Today's 3 Actions",
                "content": "[Hii sehemu itajazwa na GPT-4o]"
                if language == "sw"
                else "[This section requires GPT-4o — add OPENAI_API_KEY to .env]",
            },
            {
                "title": "Mwelekeo wa Kata" if language == "sw" else "Ward Focus",
                "content": f"Matatizo makuu: {', '.join(p['category'] for p in context.get('painpoints', [])[:3]) or 'Hakuna data'}."
                if language == "sw"
                else f"Top issues: {', '.join(p['category'] for p in context.get('painpoints', [])[:3]) or 'No data'}.",
            },
        ]
        return BriefingResult(
            candidate_id=candidate_id,
            briefing_date=briefing_date,
            language=language,
            sections=sections,
            raw_context=context,
            used_mock=True,
        )
