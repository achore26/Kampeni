"""Internal trigger endpoints — called by Prefect to kick off scheduled jobs.

These are NOT exposed to the public API gateway. They are internal service-to-service
endpoints only reachable inside the Docker network.

How it works:
  Prefect flow → POST /trigger/news → this endpoint → task.delay() → Redis queue
                                                                           ↓
                                                               Celery worker picks it up
                                                               and runs ingest_all_news()
"""
from fastapi import APIRouter

from app.tasks.news import ingest_all_news
from app.tasks.field import process_pending_field_reports

router = APIRouter(prefix="/trigger", tags=["trigger"])


@router.post("/news")
def trigger_news_ingestion() -> dict:
    """Enqueue the news ingestion task. Returns the Celery task ID."""
    task = ingest_all_news.delay()
    return {"task_id": task.id, "status": "queued", "job": "news_ingestion"}


@router.post("/field-reports")
def trigger_field_report_processing() -> dict:
    """Enqueue pending field report processing. Returns the Celery task ID."""
    task = process_pending_field_reports.delay()
    return {"task_id": task.id, "status": "queued", "job": "field_reports"}
