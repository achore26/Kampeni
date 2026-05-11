"""Internal trigger endpoint — called by Prefect after translation completes.

Flow sequence:
  Prefect → POST /trigger/painpoints
  → service pops items from articles:painpoint:pending, extracts issues, stores to Postgres
"""
from fastapi import APIRouter, Depends

from shared.internal_auth import require_internal_secret
from app.tasks import process_pending_pain_points

router = APIRouter(prefix="/trigger", tags=["trigger"], dependencies=[Depends(require_internal_secret)])


@router.post("/painpoints")
def trigger_painpoint_extraction() -> dict:
    """Run a pain point extraction batch synchronously."""
    result = process_pending_pain_points()
    return {"status": "done", **result}
