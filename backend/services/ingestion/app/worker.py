"""Ingestion worker entry point.

Runs periodic collection tasks for all MVP data sources.
Uses Celery beat for scheduling.

MVP data sources (must be live at PoC launch):
  - Facebook (Meta Graph API)
  - X/Twitter API v2  ← HIGH RISK: confirm API cost in Month 1
  - Nation Media Group (RSS)
  - Standard Group (RSS)
  - Royal Media / Citizen (RSS)
  - Hansard (weekly scrape)
  - WhatsApp field agent reports (intake API)
  - Door-to-door canvassing forms
  - Africa's Talking SMS analytics
"""
from celery import Celery
from celery.schedules import crontab

from .config import IngestionSettings

settings = IngestionSettings()

celery_app = Celery(
    "ingestion",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.beat_schedule = {
    # Social media — every 15 minutes during business hours
    "ingest-facebook": {
        "task": "app.tasks.social.ingest_facebook",
        "schedule": crontab(minute="*/15"),
    },
    "ingest-twitter": {
        "task": "app.tasks.social.ingest_twitter",
        "schedule": crontab(minute="*/15"),
    },
    # News — every 30 minutes
    "ingest-news": {
        "task": "app.tasks.news.ingest_all_news",
        "schedule": crontab(minute="*/30"),
    },
    # Hansard — weekly on Mondays
    "ingest-hansard": {
        "task": "app.tasks.government.ingest_hansard",
        "schedule": crontab(day_of_week=1, hour=6, minute=0),
    },
}


if __name__ == "__main__":
    celery_app.worker_main(["worker", "--beat", "--loglevel=info"])
