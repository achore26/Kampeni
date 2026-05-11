from fastapi import APIRouter
from shared.auth import CurrentUser

router = APIRouter()


@router.get("/me")
async def get_current_user(user: CurrentUser) -> dict:
    """Return the authenticated user's profile from their JWT claims."""
    return {
        "sub": user.get("sub"),
        "email": user.get("email") or user.get("https://kampeni.net/email"),
        "name": user.get("name") or user.get("https://kampeni.net/name"),
        "roles": user.get("https://kampeni.net/roles", []),
    }
