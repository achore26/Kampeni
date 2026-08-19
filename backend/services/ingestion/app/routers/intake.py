"""Field agent report intake — push-based endpoint + read endpoints."""
from __future__ import annotations

from enum import Enum
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from shared.config import get_settings
from shared.database import get_db
from shared.models import FieldReportRecord

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
    candidate_id: str | None = None
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


@router.get("/field-reports")
async def list_field_reports(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    candidate_id: str | None = Query(None),
    support_level: str | None = Query(None),
    ward: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List field reports with optional filters."""
    q = select(FieldReportRecord).order_by(FieldReportRecord.created_at.desc())
    if candidate_id:
        q = q.where(FieldReportRecord.candidate_id == candidate_id)
    if support_level:
        q = q.where(FieldReportRecord.support_level == support_level)
    if ward:
        q = q.where(FieldReportRecord.ward == ward)

    total_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(total_q)).scalar_one()
    rows = (await db.execute(q.offset(offset).limit(limit))).scalars().all()

    return {
        "total": total,
        "reports": [
            {
                "id": str(r.id),
                "agent_id": r.agent_id,
                "ward": r.ward,
                "report_type": r.report_type,
                "top_issue": r.top_issue,
                "support_level": r.support_level,
                "notes": r.notes,
                "candidate_id": r.candidate_id,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ],
    }


@router.get("/field-reports/summary")
async def field_reports_summary(
    candidate_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Aggregate counts by support level and top wards, scoped to a candidate."""
    base_filter = (FieldReportRecord.candidate_id == candidate_id) if candidate_id else True

    total_row = await db.execute(
        select(func.count()).select_from(FieldReportRecord).where(base_filter)
    )
    total = total_row.scalar_one()

    support_rows = await db.execute(
        select(FieldReportRecord.support_level, func.count().label("n"))
        .where(base_filter)
        .group_by(FieldReportRecord.support_level)
    )
    support_counts = {row.support_level: row.n for row in support_rows}

    ward_rows = await db.execute(
        select(FieldReportRecord.ward, func.count().label("n"))
        .where(base_filter)
        .group_by(FieldReportRecord.ward)
        .order_by(func.count().desc())
        .limit(5)
    )
    top_wards = [{"ward": row.ward, "count": row.n} for row in ward_rows]

    issue_rows = await db.execute(
        select(FieldReportRecord.top_issue, func.count().label("n"))
        .where(base_filter)
        .group_by(FieldReportRecord.top_issue)
        .order_by(func.count().desc())
    )
    issues = {row.top_issue: row.n for row in issue_rows}

    return {
        "total": total,
        "by_support": support_counts,
        "top_wards": top_wards,
        "by_issue": issues,
    }
