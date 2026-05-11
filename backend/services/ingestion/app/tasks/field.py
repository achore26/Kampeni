"""Field agent report processing — called directly by the trigger router.

No Celery. Prefect schedules this via POST /trigger/field-reports every 5 minutes.
"""
from __future__ import annotations

import json
import logging

import redis as redis_sync

from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import FieldReportRecord, Article, SentimentRecord  # noqa: F401

logger = logging.getLogger(__name__)

REDIS_FIELD_KEY = "field_reports:pending"
BATCH_SIZE = 100


def process_pending_field_reports() -> dict:
    """Pop field agent reports from Redis queue, validate, and store in Postgres."""
    Base.metadata.create_all(bind=sync_engine)

    settings = get_settings()
    r = redis_sync.from_url(settings.redis_url, decode_responses=True)

    processed = errors = 0

    for _ in range(BATCH_SIZE):
        raw = r.lpop(REDIS_FIELD_KEY)
        if raw is None:
            break

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Invalid JSON in field_reports:pending: %s", raw[:100])
            errors += 1
            continue

        try:
            record = FieldReportRecord(
                agent_id=data["agent_id"],
                ward=data["ward"],
                report_type=data["report_type"],
                top_issue=data["top_issue"],
                support_level=data["support_level"],
                notes=data.get("notes"),
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
            )
        except KeyError as exc:
            logger.warning("Missing required field in report: %s", exc)
            errors += 1
            continue

        with SyncSessionLocal() as db:
            db.add(record)
            db.commit()
            processed += 1

    r.close()
    logger.info("Field reports: processed=%d, errors=%d", processed, errors)
    return {"processed": processed, "errors": errors}


def ingest_field_report(report_data: dict) -> None:
    """Process a single report submitted directly (not via queue)."""
    logger.info("Field report received from ward: %s", report_data.get("ward", "unknown"))
