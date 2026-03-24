"""Field agent report intake — push-based endpoint."""
from __future__ import annotations

from enum import Enum

import redis.asyncio as aioredis
from fastapi import APIRouter
from pydantic import BaseModel, Field

from shared.config import get_settings

router = APIRouter()


class IssueCategory(str, Enum):
    jobs = "jobs"
    water = "water"
    school_fees = "school_fees"
    roads = "roads"
    security = "security"
    health = "health"
    other = "other"


class SupportLevel(str, Enum):
    strong_support = "strong_support"
    lean_support = "lean_support"
    undecided = "undecided"
    lean_opposition = "lean_opposition"
    strong_opposition = "strong_opposition"


class FieldReport(BaseModel):
    agent_id: str
    ward: str
    report_type: str = Field(
        description="door_to_door | rally | market | whatsapp_group | incident"
    )
    top_issue: IssueCategory
    support_level: SupportLevel
    notes: str | None = Field(None, max_length=500)
    latitude: float | None = None
    longitude: float | None = None


@router.post("/field-report", status_code=202)
async def submit_field_report(report: FieldReport) -> dict:
    """Submit a field agent report. Processed asynchronously."""
    settings = get_settings()
    r = aioredis.from_url(settings.redis_url, decode_responses=True)
    await r.rpush("field_reports:pending", report.model_dump_json())
    await r.aclose()
    return {"status": "accepted", "message": "Report queued for processing"}
