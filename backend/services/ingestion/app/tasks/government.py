"""Government data ingestion tasks."""
import logging

from ..worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def ingest_hansard() -> None:
    """Scrape Hansard — implement in Month 3 alongside opponent tracker."""
    logger.info("Hansard ingestion stub — implement in Month 3")
