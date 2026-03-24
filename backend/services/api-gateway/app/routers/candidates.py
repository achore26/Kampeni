from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_candidates() -> dict:
    # TODO: proxy to sentiment + opponent services
    return {"candidates": []}
