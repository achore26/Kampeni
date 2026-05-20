"""Pain points proxy — forwards requests to the painpoint microservice."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query

from shared.auth import CurrentUser, CandidateId
from ..config import GatewaySettings

router = APIRouter()
_settings = GatewaySettings()


def _base() -> str:
    return _settings.painpoint_service_url.rstrip("/")


async def _proxy_get(path: str, params: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(f"{_base()}{path}", params=params)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Pain point service unavailable: {exc}")


@router.get("/summary")
async def painpoint_summary(user: CurrentUser, candidate_id: CandidateId) -> dict:
    return await _proxy_get("/painpoints/summary", {"candidate_id": candidate_id})


@router.get("/by-county")
async def by_county(user: CurrentUser, candidate_id: CandidateId) -> dict:
    return await _proxy_get("/painpoints/by-county", {"candidate_id": candidate_id})


@router.get("/")
async def list_pain_points(
    user: CurrentUser,
    candidate_id: CandidateId,
    category: str | None = Query(None),
    county: str | None = Query(None),
    severity: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
) -> dict:
    return await _proxy_get("/painpoints/", {
        "candidate_id": candidate_id,
        "category": category,
        "county": county,
        "severity": severity,
        "limit": limit,
        "offset": offset,
    })
