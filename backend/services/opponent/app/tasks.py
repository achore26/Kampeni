"""Opponent mention detection tasks.

How it works:
  1. Fetch all opponent profiles from Postgres (names + aliases)
  2. Fetch articles that haven't been scanned yet (tracked in Redis set)
  3. For each article, search for each opponent's name/aliases in title + content
  4. When found: extract the containing sentence as context, save OpponentMention
  5. Mark article as scanned

Detection method: simple case-insensitive string matching.
Month 3 upgrade: spaCy NER model trained on Kenyan political entities.
"""
from __future__ import annotations

import logging
import re

import redis as redis_sync

from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import Article, OpponentMention, OpponentProfile
from shared.models import SentimentRecord  # noqa: F401 — register mapper

from .worker import celery_app

logger = logging.getLogger(__name__)

REDIS_SCANNED_KEY = "articles:opponent_scanned"  # Redis set — article IDs already scanned
BATCH_SIZE = 100  # articles to scan per task run


def _extract_context(text: str, name: str, max_len: int = 300) -> str:
    """Return the sentence containing `name`. Falls back to first 300 chars."""
    # Split into rough sentences on period/newline
    sentences = re.split(r"(?<=[.!?])\s+|\n", text)
    name_lower = name.lower()
    for sentence in sentences:
        if name_lower in sentence.lower():
            return sentence.strip()[:max_len]
    return text[:max_len]


def _names_to_search(opponent: OpponentProfile) -> list[str]:
    """All name variants to search for — full name + any aliases."""
    names = [opponent.name]
    if opponent.aliases:
        names.extend(opponent.aliases)
    return names


@celery_app.task
def scan_articles_for_opponents() -> dict:
    """Scan recent articles for opponent mentions."""
    Base.metadata.create_all(bind=sync_engine)

    settings = get_settings()
    r = redis_sync.from_url(settings.redis_url, decode_responses=True)

    scanned = found = 0

    with SyncSessionLocal() as db:
        # Load all opponents we are tracking
        opponents = db.query(OpponentProfile).all()
        if not opponents:
            r.close()
            return {"scanned": 0, "mentions_found": 0, "note": "No opponents registered yet"}

        # Fetch recent articles not yet scanned — most recent first
        articles = (
            db.query(Article)
            .order_by(Article.created_at.desc())
            .limit(BATCH_SIZE)
            .all()
        )

        for article in articles:
            article_id_str = str(article.id)

            # Skip if already scanned
            if r.sismember(REDIS_SCANNED_KEY, article_id_str):
                continue

            full_text = f"{article.title} {article.content or ''}"

            for opponent in opponents:
                for name in _names_to_search(opponent):
                    if name.lower() not in full_text.lower():
                        continue

                    # Determine if mention is in title or body
                    mention_type = "title" if name.lower() in article.title.lower() else "body"

                    # Don't create duplicate mentions for the same article+opponent
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
                    break  # one mention per opponent per article is enough

            # Mark article as scanned
            r.sadd(REDIS_SCANNED_KEY, article_id_str)
            scanned += 1

        db.commit()

    r.close()
    logger.info("Opponent scan complete: articles=%d, mentions=%d", scanned, found)
    return {"scanned": scanned, "mentions_found": found}
