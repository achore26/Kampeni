"""Translation Celery worker — processes pending raw articles from MinIO."""
from celery import Celery
from celery.schedules import crontab

from .config import get_settings

settings = get_settings()

celery_app = Celery(
    "translation",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)

celery_app.conf.beat_schedule = {
    "process-pending-translations": {
        "task": "app.tasks.process_pending_translations",
        "schedule": 60.0,  # every 60 seconds
    },
}

celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "Africa/Nairobi"
