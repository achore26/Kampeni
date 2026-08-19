"""Pain point extraction tasks — called directly by the trigger router.

No Celery. Prefect schedules this via POST /trigger/painpoints every 2 minutes.
"""
from __future__ import annotations

import json
import logging
import uuid

import redis as redis_sync

from shared import storage
from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import PainPoint, SentimentRecord

from .extractor import PainPointExtractor

logger = logging.getLogger(__name__)

REDIS_INPUT_KEY = "articles:painpoint:pending"
REDIS_EMBED_KEY = "articles:embed:pending"
BATCH_SIZE = 20


def _ensure_tables() -> None:
    Base.metadata.create_all(bind=sync_engine)


def process_pending_pain_points() -> dict:
    """Pop items from painpoint queue, extract issues, persist to Postgres."""
    _ensure_tables()

    settings = get_settings()
    r = redis_sync.from_url(settings.redis_url, decode_responses=True)
    extractor = PainPointExtractor()

    processed = skipped = errors = 0

    for _ in range(BATCH_SIZE):
        item = r.lpop(REDIS_INPUT_KEY)
        if item is None:
            break

        try:
            payload = json.loads(item)
            article_id = payload["article_id"]
            translation_key = payload["translation_key"]
        except (json.JSONDecodeError, KeyError) as exc:
            logger.warning("Invalid pain point queue item: %s — %s", item[:100], exc)
            errors += 1
            continue

        try:
            translation = storage.get_object(translation_key)
        except Exception as exc:
            logger.warning("Could not fetch translation %s: %s", translation_key, exc)
            errors += 1
            continue

        title = translation.get("translated_title", "")
        content = translation.get("translated_content", "")
        source_language = translation.get("original_language", "en")
        used_mock_translation = translation.get("used_mock", False)

        if not title and not content:
            skipped += 1
            continue

        try:
            article_uuid = uuid.UUID(article_id)
        except ValueError:
            logger.warning("Invalid article UUID: %s", article_id)
            errors += 1
            continue

        with SyncSessionLocal() as db:
            # Resolve which candidates this article was attributed to (set during sentiment)
            candidate_ids = [
                row[0]
                for row in db.query(SentimentRecord.candidate_id)
                .filter(SentimentRecord.article_id == article_uuid)
                .filter(SentimentRecord.candidate_id.isnot(None))
                .distinct()
                .all()
            ]

        # Derive the candidate's home county to use as location fallback
        # when the article text doesn't mention a county explicitly.
        CANDIDATE_COUNTY = {
            "sakaja-nairobi": "Nairobi",
        }
        default_county = next(
            (CANDIDATE_COUNTY[cid] for cid in candidate_ids if cid in CANDIDATE_COUNTY),
            None,
        )

        try:
            result = extractor.extract(title, content, source_language, default_county=default_county)
        except Exception as exc:
            logger.warning("Extraction failed for %s: %s", article_id, exc)
            errors += 1
            continue

        with SyncSessionLocal() as db:
            # Fall back to a single unscoped record if no candidates matched
            scoped_ids: list[str | None] = candidate_ids if candidate_ids else [None]

            for issue in result.issues:
                for cid in scoped_ids:
                    record = PainPoint(
                        article_id=article_uuid,
                        candidate_id=cid,
                        issue_category=issue.category,
                        issue_description=issue.description,
                        severity=issue.severity,
                        location_name=issue.location_name,
                        county=issue.county,
                        constituency=issue.constituency,
                        politicians_mentioned=issue.politicians_mentioned or [],
                        source_language=source_language,
                        confidence=issue.confidence,
                        used_mock=issue.used_mock or used_mock_translation,
                    )
                    db.add(record)
            db.commit()

        r.rpush(REDIS_EMBED_KEY, json.dumps({
            "article_id": article_id,
            "translation_key": translation_key,
        }))
        processed += 1

    r.close()
    logger.info("Pain point batch: processed=%d, skipped=%d, errors=%d", processed, skipped, errors)
    return {"processed": processed, "skipped": skipped, "errors": errors}
