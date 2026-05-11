"""Briefing API — CRUD for daily candidate briefings."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from shared.database import get_db
from shared.models import Briefing

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


# ─── Response models ──────────────────────────────────────────────────────────

class BriefingSection(BaseModel):
    title: str
    content: str


class BriefingOut(BaseModel):
    id: str
    candidate_id: str
    briefing_date: date
    language: str
    sections: list[BriefingSection]
    is_approved: bool
    approved_by: str | None
    approved_at: str | None
    delivered_at: str | None
    delivery_channels: list[str]
    used_mock: bool
    created_at: str


class ApproveRequest(BaseModel):
    approved_by: str  # Political Director's name / Auth0 sub


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/{candidate_id}/latest", response_model=BriefingOut | None)
async def get_latest_briefing(candidate_id: str, db: DbSession) -> BriefingOut | None:
    """Fetch today's briefing for a candidate. Returns None if not yet generated."""
    today = datetime.now(timezone.utc).date()
    stmt = (
        select(Briefing)
        .where(Briefing.candidate_id == candidate_id, Briefing.briefing_date == today)
        .order_by(Briefing.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    briefing = result.scalar_one_or_none()
    if not briefing:
        return None
    return _to_out(briefing)


@router.get("/{candidate_id}/history", response_model=list[BriefingOut])
async def get_briefing_history(
    candidate_id: str,
    db: DbSession,
    limit: int = Query(30, le=90),
) -> list[BriefingOut]:
    """Last N daily briefings for a candidate."""
    stmt = (
        select(Briefing)
        .where(Briefing.candidate_id == candidate_id)
        .order_by(Briefing.briefing_date.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [_to_out(b) for b in result.scalars().all()]


@router.post("/{candidate_id}/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_briefing(candidate_id: str) -> dict:
    """Trigger on-demand briefing generation for a candidate.

    Runs synchronously. Normal daily generation runs automatically at 5am EAT via Prefect.
    """
    import asyncio
    from app.tasks import generate_all_briefings
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, generate_all_briefings)
    return {
        "status": "done",
        "candidate_id": candidate_id,
        **result,
    }


@router.post("/{candidate_id}/approve/{briefing_id}", response_model=BriefingOut)
async def approve_briefing(
    candidate_id: str,
    briefing_id: str,
    body: ApproveRequest,
    db: DbSession,
) -> BriefingOut:
    """Political Director approves a briefing before 6am delivery.

    Once approved, the briefing will be delivered at 6am EAT (or immediately
    if past 6am and deliver task is triggered manually).
    """
    try:
        bid = uuid.UUID(briefing_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid briefing ID")

    briefing = await db.get(Briefing, bid)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    if briefing.candidate_id != candidate_id:
        raise HTTPException(status_code=403, detail="Briefing does not belong to this candidate")
    if briefing.is_approved:
        raise HTTPException(status_code=409, detail="Briefing already approved")

    briefing.is_approved = True
    briefing.approved_by = body.approved_by
    briefing.approved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(briefing)
    return _to_out(briefing)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _to_out(b: Briefing) -> BriefingOut:
    return BriefingOut(
        id=str(b.id),
        candidate_id=b.candidate_id,
        briefing_date=b.briefing_date,
        language=b.language,
        sections=[BriefingSection(**s) for s in (b.sections or [])],
        is_approved=b.is_approved,
        approved_by=b.approved_by,
        approved_at=b.approved_at.isoformat() if b.approved_at else None,
        delivered_at=b.delivered_at.isoformat() if b.delivered_at else None,
        delivery_channels=b.delivery_channels or [],
        used_mock=getattr(b, "used_mock", False),
        created_at=b.created_at.isoformat(),
    )
