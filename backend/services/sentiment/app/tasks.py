"""Sentiment classification — called directly by the trigger router.

No Celery. Prefect schedules this via POST /trigger/sentiment.
"""
from __future__ import annotations

import logging
import uuid

import redis as redis_sync

from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import Article, SentimentRecord

from .nlp.classifier import SentimentClassifier

logger = logging.getLogger(__name__)
REDIS_PENDING_KEY = "articles:pending"
BATCH_SIZE = 50


def process_pending_articles() -> dict:
    """Pop article IDs from Redis, classify sentiment, store results."""
    Base.metadata.create_all(bind=sync_engine)

    settings = get_settings()
    r = redis_sync.from_url(settings.redis_url, decode_responses=True)
    classifier = SentimentClassifier()

    processed = skipped = errors = 0

    for _ in range(BATCH_SIZE):
        article_id_str = r.lpop(REDIS_PENDING_KEY)
        if article_id_str is None:
            break

        try:
            article_id = uuid.UUID(article_id_str)
        except ValueError:
            logger.warning("Invalid article ID: %s", article_id_str)
            errors += 1
            continue

        with SyncSessionLocal() as db:
            article = db.query(Article).filter(Article.id == article_id).first()
            if not article:
                skipped += 1
                continue

            already_done = (
                db.query(SentimentRecord)
                .filter(SentimentRecord.article_id == article_id)
                .first()
            )
            if already_done:
                skipped += 1
                continue

            text = f"{article.title}. {(article.content or '')[:500]}"
            result = classifier.classify(text)

            record = SentimentRecord(
                article_id=article.id,
                label=result.label,
                score=round(result.score, 4),
                language_detected=result.language,
                classifier_version="vader-v1",
            )
            db.add(record)
            db.commit()
            processed += 1

    r.close()
    logger.info("Sentiment batch: processed=%d, skipped=%d, errors=%d", processed, skipped, errors)
    return {"processed": processed, "skipped": skipped, "errors": errors}
