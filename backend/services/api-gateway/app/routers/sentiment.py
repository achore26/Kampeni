"""Sentiment proxy — forwards requests to the sentiment microservice."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query

from shared.auth import CandidateId, CurrentUser
from ..config import GatewaySettings

router = APIRouter()
_settings = GatewaySettings()


def _base() -> str:
    return _settings.sentiment_service_url.rstrip("/")


async def _proxy_get(path: str, params: dict | None = None) -> dict | list:
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(f"{_base()}{path}", params=params)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Sentiment service unavailable: {exc}")


@router.get("/articles")
async def sentiment_articles(
    user: CurrentUser,
    candidate_id: CandidateId,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    source: str | None = Query(None),
) -> list:
    """Paginated articles with sentiment scores, scoped to the authenticated candidate."""
    params: dict = {"candidate_id": candidate_id, "limit": limit, "offset": offset}
    if source:
        params["source"] = source
    return await _proxy_get("/sentiment/articles", params)


@router.get("/summary")
async def sentiment_summary(
    user: CurrentUser,
    candidate_id: CandidateId,
    source: str | None = Query(None),
) -> dict:
    """Positive / negative / neutral counts for the authenticated candidate."""
    params: dict = {"candidate_id": candidate_id}
    if source:
        params["source"] = source
    return await _proxy_get("/sentiment/summary", params)


@router.get("/trend")
async def sentiment_trend(
    user: CurrentUser,
    candidate_id: CandidateId,
    days: int = Query(7, ge=1, le=30),
) -> list:
    """Daily sentiment breakdown for the last N days."""
    return await _proxy_get("/sentiment/trend", {"candidate_id": candidate_id, "days": days})


@router.get("/dashboard")
async def sentiment_dashboard(user: CurrentUser, candidate_id: CandidateId) -> dict:
    """Per-candidate sentiment breakdown."""
    return await _proxy_get(f"/sentiment/dashboard/{candidate_id}")


@router.get("/wards")
async def ward_sentiment(user: CurrentUser) -> dict:
    """Ward-level sentiment breakdown — requires geolocation tagging (Month 3)."""
    return {"wards": [], "note": "Requires geolocation tagging — scheduled for Month 3"}
