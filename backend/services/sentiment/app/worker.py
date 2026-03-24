"""Sentiment Celery worker — pops from Redis queue and classifies."""
from celery import Celery

from shared.config import get_settings

settings = get_settings()

celery_app = Celery(
    "sentiment",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)

celery_app.conf.beat_schedule = {
    "process-pending-articles": {
        "task": "app.tasks.process_pending_articles",
        "schedule": 30.0,  # every 30 seconds
    },
}

celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "Africa/Nairobi"
