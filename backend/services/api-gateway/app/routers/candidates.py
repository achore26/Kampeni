from fastapi import APIRouter

from shared.auth import CurrentUser

router = APIRouter()


@router.get("/")
async def list_candidates(user: CurrentUser) -> dict:
    # TODO: proxy to sentiment + opponent services
    return {"candidates": []}
