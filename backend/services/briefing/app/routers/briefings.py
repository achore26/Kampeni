from datetime import date

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class BriefingSection(BaseModel):
    title: str
    content: str


class DailyBriefing(BaseModel):
    candidate_id: str
    date: date
    language: str  # sw | en
    sections: list[BriefingSection]
    reviewed_by: str | None = None  # Political Director sign-off
    is_approved: bool = False


@router.get("/{candidate_id}/latest", response_model=DailyBriefing | None)
async def get_latest_briefing(candidate_id: str) -> DailyBriefing | None:
    # TODO: fetch today's approved briefing from PostgreSQL
    return None


@router.post("/{candidate_id}/generate")
async def generate_briefing(candidate_id: str) -> dict:
    # TODO: trigger GPT-4o briefing generation job via Celery
    # Structure: overnight_developments, sentiment_shifts, opponent_activity,
    #            todays_3_actions, ward_focus
    return {"status": "queued", "candidate_id": candidate_id}


@router.post("/{candidate_id}/approve/{briefing_id}")
async def approve_briefing(candidate_id: str, briefing_id: str, reviewer: str) -> dict:
    # TODO: Political Director marks briefing as approved before 6am delivery
    return {"status": "approved", "briefing_id": briefing_id, "reviewer": reviewer}
