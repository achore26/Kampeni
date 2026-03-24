"""Field agent report processing tasks."""
import logging

from ..worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def process_pending_field_reports() -> dict:
    """Process queued field agent reports — wired up in Month 3."""
    # TODO: pop from Redis field_reports:pending, classify, store
    return {"processed": 0}


@celery_app.task
def ingest_field_report(report_data: dict) -> None:
    """Process a single report submitted via intake API."""
    logger.info("Field report received from ward: %s", report_data.get("ward", "unknown"))
