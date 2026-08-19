"""Sentiment classification — called directly by the trigger router.

No Celery. Prefect schedules this via POST /trigger/sentiment.
"""
from __future__ import annotations

import logging
import uuid

import redis as redis_sync

from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import Article, CandidateConfig, SentimentRecord

from .nlp.classifier import SentimentClassifier

logger = logging.getLogger(__name__)
REDIS_PENDING_KEY = "articles:pending"
BATCH_SIZE = 50


def _load_active_configs(db) -> list[CandidateConfig]:
    return db.query(CandidateConfig).filter(CandidateConfig.is_active.is_(True)).all()


def _match_candidates(text: str, configs: list[CandidateConfig]) -> list[str]:
    """Return candidate_ids whose name_variations or keywords appear in the article text."""
    text_lower = text.lower()
    matched = []
    for cfg in configs:
        terms = [v.lower() for v in (cfg.name_variations or [])] + [k.lower() for k in (cfg.keywords or [])]
        if any(term in text_lower for term in terms):
            matched.append(cfg.candidate_id)
    return matched


def process_pending_articles() -> dict:
    """Pop article IDs from Redis, classify sentiment, store results with candidate attribution."""
    Base.metadata.create_all(bind=sync_engine)

    settings = get_settings()
    r = redis_sync.from_url(settings.redis_url, decode_responses=True)
    classifier = SentimentClassifier()

    processed = skipped = errors = 0

    # Load candidate configs once per batch — avoids N+1 queries
    with SyncSessionLocal() as cfg_db:
        configs = _load_active_configs(cfg_db)

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

            matched_candidates = _match_candidates(
                f"{article.title} {article.content or ''}",
                configs,
            )

            # If no candidates matched, fall back to the configured default candidate
            # so articles don't silently become unscoped (MVP: typically one candidate).
            if not matched_candidates:
                import os
                default_cid = os.getenv("DEV_CANDIDATE_ID", "")
                matched_candidates = [default_cid] if default_cid else []

            # Create one SentimentRecord per matched candidate (plus one global record if none match)
            candidate_ids_to_save = matched_candidates if matched_candidates else [None]
            for cid in candidate_ids_to_save:
                record = SentimentRecord(
                    article_id=article.id,
                    label=result.label,
                    score=round(result.score, 4),
                    language_detected=result.language,
                    classifier_version="vader-v1",
                    candidate_id=cid,
                )
                db.add(record)

            db.commit()
            processed += 1

    r.close()
    logger.info("Sentiment batch: processed=%d, skipped=%d, errors=%d", processed, skipped, errors)
    return {"processed": processed, "skipped": skipped, "errors": errors}
