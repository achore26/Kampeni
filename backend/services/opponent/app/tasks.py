"""Opponent mention detection — called directly by the trigger router.

No Celery. Prefect schedules this via POST /trigger/scan.
"""
from __future__ import annotations

import logging
import re

import redis as redis_sync

from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import Article, OpponentMention, OpponentProfile, SentimentRecord  # noqa: F401

logger = logging.getLogger(__name__)

REDIS_SCANNED_KEY = "articles:opponent_scanned"
BATCH_SIZE = 100


def _extract_context(text: str, name: str, max_len: int = 300) -> str:
    sentences = re.split(r"(?<=[.!?])\s+|\n", text)
    name_lower = name.lower()
    for sentence in sentences:
        if name_lower in sentence.lower():
            return sentence.strip()[:max_len]
    return text[:max_len]


def _names_to_search(opponent: OpponentProfile) -> list[str]:
    names = [opponent.name]
    if opponent.aliases:
        names.extend(opponent.aliases)
    return names


def scan_articles_for_opponents() -> dict:
    """Scan recent articles for opponent mentions."""
    Base.metadata.create_all(bind=sync_engine)

    settings = get_settings()
    r = redis_sync.from_url(settings.redis_url, decode_responses=True)

    scanned = found = 0

    with SyncSessionLocal() as db:
        opponents = db.query(OpponentProfile).all()
        if not opponents:
            r.close()
            return {"scanned": 0, "mentions_found": 0, "note": "No opponents registered yet"}

        articles = (
            db.query(Article)
            .order_by(Article.created_at.desc())
            .limit(BATCH_SIZE)
            .all()
        )

        for article in articles:
            article_id_str = str(article.id)
            if r.sismember(REDIS_SCANNED_KEY, article_id_str):
                continue

            full_text = f"{article.title} {article.content or ''}"

            for opponent in opponents:
                for name in _names_to_search(opponent):
                    if name.lower() not in full_text.lower():
                        continue

                    mention_type = "title" if name.lower() in article.title.lower() else "body"

                    existing = (
                        db.query(OpponentMention)
                        .filter(
                            OpponentMention.opponent_id == opponent.id,
                            OpponentMention.article_id == article.id,
                        )
                        .first()
                    )
                    if existing:
                        continue

                    context = _extract_context(full_text, name)
                    mention = OpponentMention(
                        opponent_id=opponent.id,
                        article_id=article.id,
                        context=context,
                        mention_type=mention_type,
                    )
                    db.add(mention)
                    found += 1
                    break

            r.sadd(REDIS_SCANNED_KEY, article_id_str)
            scanned += 1

        db.commit()

    r.close()
    logger.info("Opponent scan: articles=%d, mentions=%d", scanned, found)
    return {"scanned": scanned, "mentions_found": found}
