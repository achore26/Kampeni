"""Pipeline refresh — triggers the full intelligence pipeline on demand.

Sequence:
  1. News ingestion   (ingestion service)
  2. Sentiment        (sentiment service)
  3. Pain points      (painpoint service)  ┐ parallel
  4. Opponent scan    (opponent service)   ┘
  5. Briefing         (briefing service) — regenerate today's briefing
"""
from __future__ import annotations

import asyncio
import logging

import httpx
from fastapi import APIRouter, HTTPException

from shared.auth import CandidateId, CurrentUser
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

_TIMEOUT = 90.0


def _secret_headers() -> dict[str, str]:
    if not settings.internal_trigger_secret:
        raise HTTPException(status_code=503, detail="INTERNAL_TRIGGER_SECRET not configured")
    return {"X-Internal-Secret": settings.internal_trigger_secret}


async def _post(client: httpx.AsyncClient, url: str, label: str) -> dict:
    try:
        r = await client.post(url, headers=_secret_headers(), timeout=_TIMEOUT)
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        logger.warning("Pipeline step '%s' failed: %s", label, exc)
        return {"error": str(exc)}


@router.post("/refresh")
async def refresh_pipeline(user: CurrentUser, candidate_id: CandidateId) -> dict:
    """Run the full intelligence pipeline and return a summary.

    Steps run sequentially where order matters (ingestion → sentiment),
    then pain points and opponent scan run in parallel, then briefing regenerates.
    """
    base_ingestion  = settings.ingestion_service_url.rstrip("/")
    base_sentiment  = settings.sentiment_service_url.rstrip("/")
    base_painpoint  = settings.painpoint_service_url.rstrip("/")
    base_opponent   = settings.opponent_service_url.rstrip("/")
    base_briefing   = settings.briefing_service_url.rstrip("/")

    async with httpx.AsyncClient() as client:
        # Step 1 — news ingestion
        news = await _post(client, f"{base_ingestion}/trigger/news", "ingestion")

        # Step 2 — sentiment classification
        sentiment = await _post(client, f"{base_sentiment}/trigger/sentiment", "sentiment")

        # Step 3+4 — pain points + opponent scan in parallel
        painpoints, opponents = await asyncio.gather(
            _post(client, f"{base_painpoint}/trigger/painpoints", "painpoints"),
            _post(client, f"{base_opponent}/trigger/scan", "opponents"),
        )

        # Step 5 — force-regenerate today's briefing for this candidate
        # Uses the per-candidate endpoint which deletes and recreates (not the bulk trigger which skips existing)
        briefing = await _post(client, f"{base_briefing}/briefings/{candidate_id}/generate", "briefing")

    return {
        "status": "done",
        "ingestion":  news,
        "sentiment":  sentiment,
        "painpoints": painpoints,
        "opponents":  opponents,
        "briefing":   briefing,
    }
