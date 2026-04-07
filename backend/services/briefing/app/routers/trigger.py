"""Internal trigger endpoints — called by Prefect for the daily briefing pipeline.

Schedule (EAT = East Africa Time = UTC+3):
  5am EAT → POST /trigger/generate  → generate briefings for all active candidates
  6am EAT → POST /trigger/deliver   → send approved briefings via push/email/SMS
"""
from fastapi import APIRouter

from app.tasks import generate_all_briefings, deliver_approved_briefings

router = APIRouter(prefix="/trigger", tags=["trigger"])


@router.post("/generate")
def trigger_briefing_generation() -> dict:
    """Generate daily briefings for all active candidates."""
    task = generate_all_briefings.delay()
    return {"task_id": task.id, "status": "queued", "job": "briefing_generation"}


@router.post("/deliver")
def trigger_briefing_delivery() -> dict:
    """Deliver approved briefings to candidates."""
    task = deliver_approved_briefings.delay()
    return {"task_id": task.id, "status": "queued", "job": "briefing_delivery"}
