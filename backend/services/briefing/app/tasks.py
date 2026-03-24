"""Celery tasks for scheduled briefing delivery.

Scheduled: 5am EAT daily (generate + PD review window)
Delivery: 6am EAT push notification + email + SMS fallback
"""
from celery import Celery
from celery.schedules import crontab

from .config import BriefingSettings

settings = BriefingSettings()

celery_app = Celery(
    "briefing",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.beat_schedule = {
    "generate-daily-briefings": {
        "task": "app.tasks.generate_all_briefings",
        # 5am EAT = 2am UTC
        "schedule": crontab(hour=2, minute=0),
    },
    "deliver-approved-briefings": {
        "task": "app.tasks.deliver_approved_briefings",
        # 6am EAT = 3am UTC
        "schedule": crontab(hour=3, minute=0),
    },
}


@celery_app.task
def generate_all_briefings() -> None:
    # TODO: iterate over active candidates and trigger generation
    pass


@celery_app.task
def deliver_approved_briefings() -> None:
    # TODO: fetch approved briefings and deliver via push + email + SMS
    pass
