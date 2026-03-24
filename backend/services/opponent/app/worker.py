"""Opponent tracker Celery worker.

Scans saved articles for opponent name mentions every 5 minutes.
"""
from celery import Celery

from shared.config import get_settings

settings = get_settings()

celery_app = Celery(
    "opponent",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)

celery_app.conf.beat_schedule = {
    "scan-articles-for-opponents": {
        "task": "app.tasks.scan_articles_for_opponents",
        "schedule": 300.0,  # every 5 minutes
    },
}

celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "Africa/Nairobi"
