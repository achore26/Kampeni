"""Internal trigger endpoints — called by Prefect for the daily briefing pipeline.

Schedule (EAT = East Africa Time = UTC+3):
  5am EAT → POST /trigger/generate  → generate briefings for all active candidates
  6am EAT → POST /trigger/deliver   → send approved briefings via push/email/SMS
"""
from fastapi import APIRouter, Depends

from shared.internal_auth import require_internal_secret
from app.tasks import generate_all_briefings, deliver_approved_briefings

router = APIRouter(prefix="/trigger", tags=["trigger"], dependencies=[Depends(require_internal_secret)])


@router.post("/generate")
def trigger_briefing_generation() -> dict:
    """Generate daily briefings for all active candidates."""
    result = generate_all_briefings()
    return {"status": "done", **result}


@router.post("/deliver")
def trigger_briefing_delivery() -> dict:
    """Deliver approved briefings to candidates."""
    result = deliver_approved_briefings()
    return {"status": "done", **result}
