"""Intake proxy — forwards field agent reports to the ingestion microservice."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Request

from ..config import GatewaySettings

router = APIRouter()
_settings = GatewaySettings()


def _base() -> str:
    return _settings.ingestion_service_url.rstrip("/")


@router.post("/field-report", status_code=202)
async def submit_field_report(request: Request) -> dict:
    """Accept a field agent report and forward to ingestion service for queuing."""
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.post(f"{_base()}/intake/field-report", json=body)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Ingestion service unavailable: {exc}")
