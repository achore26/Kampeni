"""Internal trigger endpoint authentication.

Trigger endpoints are service-to-service only (Prefect → FastAPI).
They are NOT exposed via the API gateway but are reachable on the Docker
network. This shared secret prevents unauthorized callers from triggering
AI workloads, briefing delivery, or scraping jobs.

Usage in trigger routers:
    from shared.internal_auth import require_internal_secret
    router = APIRouter(prefix="/trigger", dependencies=[Depends(require_internal_secret)])
"""
import hmac

from fastapi import Depends, Header, HTTPException, status

from .config import get_settings


async def require_internal_secret(
    x_internal_secret: str = Header(..., alias="X-Internal-Secret"),
) -> None:
    """Validate the shared secret on all internal trigger endpoints."""
    settings = get_settings()
    expected = settings.internal_trigger_secret
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="INTERNAL_TRIGGER_SECRET not configured",
        )
    # Constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(x_internal_secret, expected):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )
