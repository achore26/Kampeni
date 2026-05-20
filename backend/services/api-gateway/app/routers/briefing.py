"""Briefing proxy — forwards requests to the briefing microservice."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query, Request

from shared.auth import CurrentUser, PoliticalDirectorOrAbove, CampaignManagerOrAbove
from ..config import GatewaySettings

router = APIRouter()
_settings = GatewaySettings()


def _base() -> str:
    return _settings.briefing_service_url.rstrip("/")


async def _proxy_get(path: str, params: dict | None = None) -> dict | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.get(f"{_base()}{path}", params=params)
            if r.status_code == 404:
                return None
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Briefing service unavailable: {exc}")


async def _proxy_post(path: str, body: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            r = await client.post(f"{_base()}{path}", json=body or {})
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Briefing service unavailable: {exc}")


@router.get("/latest")
async def get_latest_briefing(
    user: CurrentUser,
    candidate_id: str = Query(..., description="Candidate ID to fetch briefing for"),
) -> dict | None:
    """Fetch today's AI briefing for the given candidate."""
    return await _proxy_get(f"/briefings/{candidate_id}/latest")


@router.get("/history")
async def get_briefing_history(
    user: CurrentUser,
    candidate_id: str = Query(...),
    limit: int = Query(30, le=90),
) -> list:
    """Last N daily briefings for a candidate."""
    result = await _proxy_get(f"/briefings/{candidate_id}/history", {"limit": limit})
    return result or []


@router.post("/generate")
async def generate_briefing(
    user: CurrentUser,
    _: dict = CampaignManagerOrAbove,
    candidate_id: str = Query(...),
) -> dict:
    """Trigger on-demand briefing generation for a candidate."""
    return await _proxy_post(f"/briefings/{candidate_id}/generate")


@router.post("/{briefing_id}/approve")
async def approve_briefing(
    user: CurrentUser,
    briefing_id: str,
    _: dict = PoliticalDirectorOrAbove,
    candidate_id: str = Query(...),
    request: Request = None,
) -> dict:
    """Political Director approves a briefing before 6am delivery."""
    body: dict = {}
    if request:
        try:
            body = await request.json()
        except Exception:
            pass
    body["approved_by"] = user.get("name") or user.get("email") or user.get("sub", "unknown")
    result = await _proxy_post(f"/briefings/{candidate_id}/approve/{briefing_id}", body)
    return result or {}
