import json
import logging
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = "claude-opus-4-7"

SYSTEM_PROMPT = """You are Kampeni Intelligence's AI dashboard generator. Kampeni is Kenya's political intelligence platform used by candidates and their inner circles.

Your job: given available campaign data and parameters, generate a focused, insightful dashboard config that surfaces the most strategically relevant intelligence.

Respond ONLY with a valid JSON object — no markdown fences, no explanation, no preamble. The JSON must exactly match this structure:

{
  "title": "Dashboard title (short, specific)",
  "subtitle": "One-line context e.g. 'Nairobi County · Last 30 days'",
  "narrative": "2-3 sentence intelligence briefing. Be specific and actionable — what should the candidate know and do?",
  "panels": [
    {
      "id": "unique_id",
      "type": "bar|pie|stat|list",
      "title": "Panel title",
      "width": "full|half|third",
      "data": [],
      "config": {}
    }
  ]
}

Panel type specs:
- "bar": data = [{name, value},...], config = {color?, vertical?}
- "pie": data = [{name, value, color},...], config = {innerRadius?}
- "stat": data = [{label, value, change?, color?},...], config = {}
- "list": data = [{title, subtitle?, badge?, badgeColor?},...], config = {}

Generate 3–5 panels. Choose types that best fit the data. If data is sparse, still provide meaningful structure with honest "No data yet" placeholders in the narrative."""


class DashboardParams(BaseModel):
    county: str = "All Kenya"
    time_range: str = "30d"
    focus: str = "comprehensive"
    candidate_id: str | None = None


async def _gather_data(params: DashboardParams) -> dict[str, Any]:
    """Fetch available data from internal services. Returns empty structures on failure."""
    base = settings.internal_api_base or "http://localhost:8000"
    data: dict[str, Any] = {}

    async with httpx.AsyncClient(timeout=8.0) as client:
        endpoints = [
            ("painpoints_summary", f"{base}/api/v1/painpoints/summary"),
            ("painpoints_counties", f"{base}/api/v1/painpoints/by-county"),
            ("sentiment", f"{base}/api/v1/sentiment/stats"),
            ("field_reports", f"{base}/api/v1/intake/field-reports/summary"),
        ]
        for key, url in endpoints:
            try:
                r = await client.get(url)
                if r.status_code == 200:
                    data[key] = r.json()
            except Exception:
                pass  # partial data is fine

    return data


@router.post("/generate")
async def generate_dashboard(params: DashboardParams):
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY not configured. Add it to your .env file.",
        )

    available_data = await _gather_data(params)

    time_label = {
        "7d": "last 7 days",
        "14d": "last 14 days",
        "30d": "last 30 days",
        "90d": "last 90 days",
        "all": "all time",
    }.get(params.time_range, params.time_range)

    user_message = f"""Generate a dashboard for:
- Location: {params.county}
- Period: {time_label}
- Focus: {params.focus}

Available data from the platform:
{json.dumps(available_data, indent=2) if available_data else "No live data available yet — generate a template dashboard with placeholder values and note in the narrative that data will populate once the ingestion pipeline is running."}

Generate the JSON dashboard config now."""

    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 2048,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_message}],
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ANTHROPIC_API_URL,
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error("Anthropic API error: %s", e.response.text)
        raise HTTPException(status_code=502, detail="AI service error — check ANTHROPIC_API_KEY")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timed out")

    body = response.json()
    content_blocks = body.get("content") or []
    if not content_blocks or content_blocks[0].get("type") != "text":
        logger.error("Unexpected Anthropic response shape: %s", str(body)[:300])
        raise HTTPException(status_code=500, detail="AI returned unexpected response format — try again")

    content = content_blocks[0]["text"].strip()

    # Strip markdown fences if Claude wraps the JSON despite instructions
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        dashboard = json.loads(content)
    except json.JSONDecodeError:
        logger.error("Claude returned non-JSON: %s", content[:500])
        raise HTTPException(status_code=500, detail="AI returned invalid response — try again")

    return dashboard
