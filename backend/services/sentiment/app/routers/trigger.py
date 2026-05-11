"""Internal trigger endpoint — called by Prefect after news ingestion completes.

Flow sequence:
  Prefect: trigger news ingestion → wait → POST /trigger/sentiment
  → service pops article IDs from Redis and classifies them synchronously
"""
from fastapi import APIRouter, Depends

from shared.internal_auth import require_internal_secret
from app.tasks import process_pending_articles

router = APIRouter(prefix="/trigger", tags=["trigger"], dependencies=[Depends(require_internal_secret)])


@router.post("/sentiment")
def trigger_sentiment_classification() -> dict:
    """Run a sentiment classification batch synchronously."""
    result = process_pending_articles()
    return {"status": "done", **result}
