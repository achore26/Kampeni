"""Candidate config endpoints — profile + watchlist management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import CandidateId, CurrentUser, CampaignManagerOrAbove
from shared.database import get_db
from shared.models import CandidateConfig

router = APIRouter()
DbSession = Depends(get_db)


class CandidateConfigOut(BaseModel):
    candidate_id: str
    display_name: str
    name_variations: list[str]
    county: str
    constituency: str | None
    keywords: list[str]
    language: str
    is_active: bool


class CandidateConfigUpdate(BaseModel):
    display_name: str | None = None
    name_variations: list[str] | None = None
    county: str | None = None
    constituency: str | None = None
    keywords: list[str] | None = None
    language: str | None = None


@router.get("/me", response_model=CandidateConfigOut)
async def get_my_config(
    user: CurrentUser,
    candidate_id: CandidateId,
    db: AsyncSession = Depends(get_db),
) -> CandidateConfigOut:
    """Return the current candidate's watchlist configuration."""
    result = await db.execute(
        select(CandidateConfig).where(CandidateConfig.candidate_id == candidate_id)
    )
    cfg = result.scalar_one_or_none()
    if not cfg:
        raise HTTPException(status_code=404, detail=f"No config found for candidate '{candidate_id}'. Ask your Kampeni administrator to set it up.")
    return CandidateConfigOut(
        candidate_id=cfg.candidate_id,
        display_name=cfg.display_name,
        name_variations=cfg.name_variations or [],
        county=cfg.county,
        constituency=cfg.constituency,
        keywords=cfg.keywords or [],
        language=cfg.language,
        is_active=cfg.is_active,
    )


@router.patch("/me", response_model=CandidateConfigOut)
async def update_my_config(
    user: CurrentUser,
    candidate_id: CandidateId,
    body: CandidateConfigUpdate,
    _: dict = CampaignManagerOrAbove,
    db: AsyncSession = Depends(get_db),
) -> CandidateConfigOut:
    """Update the authenticated candidate's watchlist (campaign manager or above)."""
    result = await db.execute(
        select(CandidateConfig).where(CandidateConfig.candidate_id == candidate_id)
    )
    cfg = result.scalar_one_or_none()
    if not cfg:
        raise HTTPException(status_code=404, detail=f"No config found for candidate '{candidate_id}'.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(cfg, field, value)
    await db.commit()
    await db.refresh(cfg)

    return CandidateConfigOut(
        candidate_id=cfg.candidate_id,
        display_name=cfg.display_name,
        name_variations=cfg.name_variations or [],
        county=cfg.county,
        constituency=cfg.constituency,
        keywords=cfg.keywords or [],
        language=cfg.language,
        is_active=cfg.is_active,
    )


@router.get("/")
async def list_candidates(user: CurrentUser) -> dict:
    """Admin-only: list all candidate configs. Returns empty for non-admins."""
    return {"candidates": []}
