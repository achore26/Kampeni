"""Social media ingestion tasks.

NOTE on X/Twitter: API pricing is HIGH RISK for early-stage.
Confirm access tier and cost in Month 1 before building dependency.
Fallback: weight Facebook + TikTok more heavily if X is too expensive.
"""
from ..worker import celery_app


@celery_app.task
def ingest_facebook() -> None:
    # TODO: Meta Graph API — public posts, comments, page interactions
    # Start with public page content; app review for elevated access takes 2–4 weeks
    pass


@celery_app.task
def ingest_twitter() -> None:
    # TODO: X API v2 bearer token — mentions, hashtags, trending topics
    # HIGH RISK: confirm USD 100+/month API cost is budgeted before wiring this up
    pass
