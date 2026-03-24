from fastapi import APIRouter

router = APIRouter()


@router.get("/me")
async def get_current_user() -> dict:
    # TODO: validate Auth0 JWT and return user profile
    return {"message": "auth endpoint — implement Auth0 validation"}
