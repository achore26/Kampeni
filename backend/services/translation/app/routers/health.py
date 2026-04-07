from fastapi import APIRouter
from ..config import get_settings

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "service": "translation",
        "api_configured": bool(settings.translation_api_url),
        "mode": "live" if settings.translation_api_url else "mock",
    }
