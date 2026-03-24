"""Auth0 JWT validation middleware — shared across all services."""
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from .config import get_settings

settings = get_settings()
security = HTTPBearer()


async def _get_jwks() -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://{settings.auth0_domain}/.well-known/jwks.json"
        )
        resp.raise_for_status()
        return resp.json()


async def verify_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(security)],
) -> dict:
    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        header = jwt.get_unverified_header(token)
        key = next(k for k in jwks["keys"] if k["kid"] == header["kid"])
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.auth0_audience,
        )
        return payload
    except (JWTError, StopIteration) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


CurrentUser = Annotated[dict, Depends(verify_token)]
