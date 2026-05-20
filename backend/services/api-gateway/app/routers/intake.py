"""Intake proxy — forwards field agent reports to the ingestion microservice."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query, Request

from shared.auth import CurrentUser, CandidateId
from ..config import GatewaySettings

router = APIRouter()
_settings = GatewaySettings()


def _base() -> str:
    return _settings.ingestion_service_url.rstrip("/")


async def _proxy_get(path: str, params: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(f"{_base()}{path}", params=params)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Ingestion service unavailable: {exc}")


@router.post("/field-report", status_code=202)
async def submit_field_report(
    user: CurrentUser,
    candidate_id: CandidateId,
    request: Request,
) -> dict:
    """Accept a field agent report and forward to ingestion service for queuing."""
    body = await request.json()
    # Inject scoping fields — the client never needs to send these manually
    body["candidate_id"] = candidate_id
    # Always override agent_id from the verified JWT — never trust client-supplied value
    body["agent_id"] = user.get("email") or user.get("sub")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.post(f"{_base()}/intake/field-report", json=body)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Ingestion service unavailable: {exc}")


@router.get("/field-reports")
async def list_field_reports(
    user: CurrentUser,
    candidate_id: CandidateId,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    support_level: str | None = Query(None),
    ward: str | None = Query(None),
) -> dict:
    params: dict = {
        "candidate_id": candidate_id,
        "limit": limit,
        "offset": offset,
    }
    if support_level:
        params["support_level"] = support_level
    if ward:
        params["ward"] = ward
    return await _proxy_get("/intake/field-reports", params)


@router.get("/field-reports/summary")
async def field_reports_summary(user: CurrentUser, candidate_id: CandidateId) -> dict:
    return await _proxy_get("/intake/field-reports/summary", {"candidate_id": candidate_id})
