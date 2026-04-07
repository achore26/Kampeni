from fastapi import APIRouter

from ..config import get_settings

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "service": "painpoint",
        "mode": "live" if settings.anthropic_api_key else "mock",
    }
