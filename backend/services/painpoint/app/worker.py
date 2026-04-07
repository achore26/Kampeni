"""Pain point extraction Celery worker."""
from celery import Celery

from .config import get_settings

settings = get_settings()

celery_app = Celery(
    "painpoint",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],
)

celery_app.conf.beat_schedule = {
    "process-pending-pain-points": {
        "task": "app.tasks.process_pending_pain_points",
        "schedule": 90.0,  # every 90 seconds — runs after translation (60s)
    },
}

celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "Africa/Nairobi"
