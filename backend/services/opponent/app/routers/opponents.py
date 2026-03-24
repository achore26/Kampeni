from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class OpponentProfile(BaseModel):
    id: str
    name: str
    constituency: str
    is_incumbent: bool


@router.get("/{opponent_id}/profile")
async def get_opponent_profile(opponent_id: str) -> dict:
    # TODO: return full opponent profile with latest activity
    return {"opponent_id": opponent_id, "profile": None}


@router.get("/{opponent_id}/daily-digest")
async def get_daily_digest(opponent_id: str) -> dict:
    # TODO: last 24h activity summary
    return {"opponent_id": opponent_id, "digest": []}


@router.get("/{opponent_id}/vulnerabilities")
async def get_vulnerabilities(opponent_id: str) -> dict:
    # TODO: ranked list of exposed positions + evidence links
    return {"opponent_id": opponent_id, "vulnerabilities": []}


@router.get("/{opponent_id}/inconsistencies")
async def get_inconsistencies(opponent_id: str) -> dict:
    # TODO: side-by-side statement comparisons
    return {"opponent_id": opponent_id, "inconsistencies": []}
