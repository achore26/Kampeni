"""Opponent tracker API — real DB-backed endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import Article, OpponentMention, OpponentProfile

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


# ─── Request / Response models ────────────────────────────────────────────────

class AddOpponentRequest(BaseModel):
    name: str
    constituency: str
    aliases: list[str] = []
    party: str | None = None
    position: str | None = None
    is_incumbent: bool = False
    twitter_handle: str | None = None
    candidate_id: str | None = None


class OpponentOut(BaseModel):
    id: str
    name: str
    constituency: str
    party: str | None
    position: str | None
    is_incumbent: bool
    mention_count: int = 0


class MentionOut(BaseModel):
    article_id: str
    article_title: str
    article_url: str
    source: str
    published_at: str | None
    context: str
    mention_type: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[OpponentOut])
async def list_opponents(db: DbSession, candidate_id: str | None = None) -> list[OpponentOut]:
    """List all tracked opponents with their total mention count."""
    stmt = select(
        OpponentProfile,
        func.count(OpponentMention.id).label("mention_count"),
    ).outerjoin(
        OpponentMention, OpponentMention.opponent_id == OpponentProfile.id
    ).group_by(OpponentProfile.id)

    if candidate_id:
        stmt = stmt.where(OpponentProfile.candidate_id == candidate_id)

    result = await db.execute(stmt)
    return [
        OpponentOut(
            id=str(opp.id),
            name=opp.name,
            constituency=opp.constituency,
            party=opp.party,
            position=opp.position,
            is_incumbent=opp.is_incumbent,
            mention_count=count,
        )
        for opp, count in result.all()
    ]


@router.post("/", response_model=OpponentOut, status_code=status.HTTP_201_CREATED)
async def add_opponent(body: AddOpponentRequest, db: DbSession) -> OpponentOut:
    """Register a new opponent to monitor."""
    profile = OpponentProfile(
        name=body.name,
        constituency=body.constituency,
        aliases=body.aliases or None,
        party=body.party,
        position=body.position,
        is_incumbent=body.is_incumbent,
        twitter_handle=body.twitter_handle,
        candidate_id=body.candidate_id,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return OpponentOut(
        id=str(profile.id),
        name=profile.name,
        constituency=profile.constituency,
        party=profile.party,
        position=profile.position,
        is_incumbent=profile.is_incumbent,
        mention_count=0,
    )


@router.get("/{opponent_id}/profile")
async def get_opponent_profile(opponent_id: str, db: DbSession) -> dict:
    """Full profile + mention stats for one opponent."""
    try:
        oid = uuid.UUID(opponent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid opponent ID")

    opponent = await db.get(OpponentProfile, oid)
    if not opponent:
        raise HTTPException(status_code=404, detail="Opponent not found")

    # Count total mentions and last 7 days
    total_stmt = select(func.count(OpponentMention.id)).where(
        OpponentMention.opponent_id == oid
    )
    week_stmt = select(func.count(OpponentMention.id)).where(
        OpponentMention.opponent_id == oid,
        OpponentMention.created_at >= datetime.now(timezone.utc) - timedelta(days=7),
    )
    total = (await db.execute(total_stmt)).scalar_one()
    week = (await db.execute(week_stmt)).scalar_one()

    return {
        "id": str(opponent.id),
        "name": opponent.name,
        "aliases": opponent.aliases or [],
        "constituency": opponent.constituency,
        "party": opponent.party,
        "position": opponent.position,
        "is_incumbent": opponent.is_incumbent,
        "twitter_handle": opponent.twitter_handle,
        "stats": {
            "total_mentions": total,
            "mentions_last_7_days": week,
        },
    }


@router.get("/{opponent_id}/daily-digest", response_model=list[MentionOut])
async def get_daily_digest(opponent_id: str, db: DbSession) -> list[MentionOut]:
    """All article mentions from the last 24 hours."""
    try:
        oid = uuid.UUID(opponent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid opponent ID")

    since = datetime.now(timezone.utc) - timedelta(hours=24)

    stmt = (
        select(OpponentMention, Article)
        .join(Article, Article.id == OpponentMention.article_id)
        .where(
            OpponentMention.opponent_id == oid,
            OpponentMention.created_at >= since,
        )
        .order_by(Article.published_at.desc().nullslast())
    )
    result = await db.execute(stmt)

    return [
        MentionOut(
            article_id=str(art.id),
            article_title=art.title,
            article_url=art.url,
            source=art.source,
            published_at=art.published_at.isoformat() if art.published_at else None,
            context=mention.context,
            mention_type=mention.mention_type,
        )
        for mention, art in result.all()
    ]


@router.get("/{opponent_id}/mentions", response_model=list[MentionOut])
async def get_all_mentions(
    opponent_id: str,
    db: DbSession,
    limit: int = 50,
    offset: int = 0,
) -> list[MentionOut]:
    """Paginated full mention history for an opponent."""
    try:
        oid = uuid.UUID(opponent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid opponent ID")

    stmt = (
        select(OpponentMention, Article)
        .join(Article, Article.id == OpponentMention.article_id)
        .where(OpponentMention.opponent_id == oid)
        .order_by(Article.published_at.desc().nullslast())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)

    return [
        MentionOut(
            article_id=str(art.id),
            article_title=art.title,
            article_url=art.url,
            source=art.source,
            published_at=art.published_at.isoformat() if art.published_at else None,
            context=mention.context,
            mention_type=mention.mention_type,
        )
        for mention, art in result.all()
    ]


@router.get("/{opponent_id}/vulnerabilities")
async def get_vulnerabilities(opponent_id: str, db: DbSession) -> dict:
    """Ranked vulnerability analysis — requires NLP pipeline (Month 3)."""
    return {
        "opponent_id": opponent_id,
        "vulnerabilities": [],
        "note": "Requires NLP pipeline — scheduled for Month 3",
    }


@router.get("/{opponent_id}/inconsistencies")
async def get_inconsistencies(opponent_id: str, db: DbSession) -> dict:
    """Statement inconsistency detection — requires Hansard + NLP (Month 3)."""
    return {
        "opponent_id": opponent_id,
        "inconsistencies": [],
        "note": "Requires Hansard integration — scheduled for Month 3",
    }
