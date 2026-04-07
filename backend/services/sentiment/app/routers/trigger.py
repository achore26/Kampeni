"""Internal trigger endpoint — called by Prefect after news ingestion completes.

Flow sequence:
  Prefect: trigger news ingestion → wait → POST /trigger/sentiment
  → sentiment worker pops article IDs from Redis and classifies them
"""
from fastapi import APIRouter

from app.tasks import process_pending_articles

router = APIRouter(prefix="/trigger", tags=["trigger"])


@router.post("/sentiment")
def trigger_sentiment_classification() -> dict:
    """Enqueue a sentiment classification batch. Returns the Celery task ID."""
    task = process_pending_articles.delay()
    return {"task_id": task.id, "status": "queued", "job": "sentiment_classification"}
