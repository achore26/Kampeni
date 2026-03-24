"""Social media ingestion tasks.

NOTE on X/Twitter: Confirm API tier and cost in Month 1 before implementing.
USD 100+/month minimum. Fallback: weight Facebook + TikTok if cost is prohibitive.
"""
import logging

from ..worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task
def ingest_facebook() -> None:
    """Meta Graph API ingestion — implement in Month 2."""
    # TODO: Meta Graph API — public posts, comments, page interactions
    # App review takes 2-4 weeks — start the process immediately
    logger.info("Facebook ingestion stub — implement in Month 2")


@celery_app.task
def ingest_twitter() -> None:
    """X/Twitter ingestion — confirm API cost first."""
    # HIGH RISK: confirm USD 100+/month API cost is budgeted before implementing
    logger.info("Twitter ingestion stub — confirm API cost in Month 1")
