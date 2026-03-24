"""Opponent tracker proxy — forwards requests to the opponent microservice."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query, Request

from ..config import GatewaySettings

router = APIRouter()
_settings = GatewaySettings()


def _base() -> str:
    return _settings.opponent_service_url.rstrip("/")


async def _proxy_get(path: str, params: dict | None = None) -> dict | list:
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(f"{_base()}{path}", params=params)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Opponent service unavailable: {exc}")


async def _proxy_post(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.post(f"{_base()}{path}", json=body)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Opponent service unavailable: {exc}")


@router.get("/")
async def list_opponents(candidate_id: str | None = Query(None)) -> list:
    """List all tracked opponents with total mention counts."""
    params = {"candidate_id": candidate_id} if candidate_id else None
    return await _proxy_get("/opponents/", params)


@router.post("/")
async def add_opponent(request: Request) -> dict:
    """Register a new opponent to monitor."""
    body = await request.json()
    return await _proxy_post("/opponents/", body)


@router.get("/daily-digest")
async def daily_digest(opponent_id: str = Query(...)) -> list:
    """Last 24h mentions for an opponent."""
    return await _proxy_get(f"/opponents/{opponent_id}/daily-digest")


@router.get("/{opponent_id}/profile")
async def opponent_profile(opponent_id: str) -> dict:
    """Full profile + mention stats."""
    return await _proxy_get(f"/opponents/{opponent_id}/profile")


@router.get("/{opponent_id}/mentions")
async def opponent_mentions(
    opponent_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list:
    """Paginated full mention history."""
    return await _proxy_get(
        f"/opponents/{opponent_id}/mentions",
        {"limit": limit, "offset": offset},
    )
