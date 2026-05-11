"""Internal trigger endpoints — called by Prefect to kick off scheduled jobs.

These are NOT exposed to the public API gateway. They are internal service-to-service
endpoints only reachable inside the Docker network.

How it works:
  Prefect flow → POST /trigger/news → this endpoint → runs synchronously → returns result
"""
from fastapi import APIRouter, Depends

from shared.internal_auth import require_internal_secret
from app.tasks.news import ingest_all_news
from app.tasks.social import ingest_facebook_pages, ingest_facebook_forager
from app.tasks.field import process_pending_field_reports

router = APIRouter(prefix="/trigger", tags=["trigger"], dependencies=[Depends(require_internal_secret)])


@router.post("/news")
def trigger_news_ingestion() -> dict:
    """Run news + YouTube ingestion synchronously."""
    result = ingest_all_news()
    return {"status": "done", **result}


@router.post("/social")
def trigger_social_ingestion() -> dict:
    """Run Facebook page scraper + forager sequentially."""
    pages_result = ingest_facebook_pages()
    forager_result = ingest_facebook_forager()
    return {
        "status": "done",
        "facebook_pages": pages_result,
        "facebook_forager": forager_result,
    }


@router.post("/field-reports")
def trigger_field_report_processing() -> dict:
    """Process pending field reports synchronously."""
    result = process_pending_field_reports()
    return {"status": "done", **result}
