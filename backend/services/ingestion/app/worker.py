"""Ingestion Celery worker — periodic data collection."""
from celery import Celery
from celery.schedules import crontab

from shared.config import get_settings

settings = get_settings()

celery_app = Celery(
    "ingestion",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.tasks.news",
        "app.tasks.field",
        "app.tasks.government",
    ],
)

celery_app.conf.beat_schedule = {
    "ingest-news": {
        "task": "app.tasks.news.ingest_all_news",
        "schedule": 1800.0,  # 30 minutes
    },
    "process-field-reports": {
        "task": "app.tasks.field.process_pending_field_reports",
        "schedule": 300.0,  # 5 minutes
    },
}

celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "Africa/Nairobi"
