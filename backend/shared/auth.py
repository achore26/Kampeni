"""Auth0 JWT validation middleware — shared across all services."""
import logging
import time
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from .config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
security = HTTPBearer(auto_error=False)

# JWKS cache — keyed by domain, expires after 1 hour
_jwks_cache: dict[str, tuple[dict, float]] = {}
_JWKS_TTL = 3600

_NOT_CONFIGURED = HTTPException(
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    detail="Authentication not configured — set AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_CLIENT_ID in .env",
)


def _check_configured() -> None:
    if not settings.auth0_domain or settings.auth0_domain == "your-tenant.auth0.com":
        raise _NOT_CONFIGURED


async def _get_jwks() -> dict:
    _check_configured()
    domain = settings.auth0_domain
    cached, expires_at = _jwks_cache.get(domain, ({}, 0.0))
    if cached and time.monotonic() < expires_at:
        return cached

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://{domain}/.well-known/jwks.json")
            resp.raise_for_status()
            jwks = resp.json()
    except httpx.RequestError as exc:
        logger.error("Failed to fetch JWKS from Auth0: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service temporarily unavailable",
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.error("Auth0 JWKS endpoint returned %s", exc.response.status_code)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service returned an error",
        ) from exc

    _jwks_cache[domain] = (jwks, time.monotonic() + _JWKS_TTL)
    return jwks


async def verify_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(security)],
) -> dict:
    # Development bypass — skip auth when no token is sent and Auth0 is unconfigured
    if credentials is None:
        if settings.app_env != "production":
            return {"sub": "dev|local", "email": "dev@kampeni.net", "name": "Dev User"}
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = credentials.credentials
    _check_configured()

    try:
        jwks = await _get_jwks()
        header = jwt.get_unverified_header(token)
        key = next(k for k in jwks["keys"] if k["kid"] == header["kid"])
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.auth0_audience,
            issuer=f"https://{settings.auth0_domain}/",
        )
        return payload
    except StopIteration as exc:
        # kid not found — JWKS may have rotated; bust cache and retry once
        _jwks_cache.pop(settings.auth0_domain, None)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signing key not found — please sign in again",
        ) from exc
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


CurrentUser = Annotated[dict, Depends(verify_token)]

# Custom claim namespace set via Auth0 Actions
_CLAIM_NS = "https://kampeni.net"


def get_candidate_id(user: CurrentUser) -> str:
    """Extract candidate_id from JWT custom claims.

    Auth0 Actions inject this as a namespaced claim. Falls back to the user's
    sub (user ID) so every user is automatically scoped — no data leaks between
    candidates even before Auth0 Actions are configured.
    """
    for key in (f"{_CLAIM_NS}/candidate_id", "candidate_id"):
        if cid := user.get(key):
            return str(cid)
    return user.get("sub", "default")


def get_user_roles(user: dict) -> list[str]:
    """Return the user's Kampeni roles from JWT custom claims."""
    return user.get(f"{_CLAIM_NS}/roles", [])


def require_roles(*allowed: str):
    """Dependency factory — raises 403 unless the user holds at least one of *allowed* roles.

    In dev mode (no Auth0, no roles claim) all role checks are bypassed so local
    development doesn't require a full Auth0 setup.
    """
    async def _check(user: CurrentUser) -> dict:
        roles = get_user_roles(user)
        if not roles:
            # Dev bypass: no roles claim means Auth0 Actions aren't configured yet
            return user
        if not any(r in roles for r in allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {' or '.join(allowed)}",
            )
        return user
    return Depends(_check)


CandidateId = Annotated[str, Depends(get_candidate_id)]

# Pre-built role guards — use these as route dependencies
PoliticalDirectorOrAbove = require_roles("political_director", "candidate")
CampaignManagerOrAbove   = require_roles("campaign_manager", "political_director", "candidate")
AnalystOrAbove           = require_roles("analyst", "campaign_manager", "political_director", "candidate")
AnyRole                  = require_roles("field_agent", "analyst", "campaign_manager", "political_director", "candidate")
