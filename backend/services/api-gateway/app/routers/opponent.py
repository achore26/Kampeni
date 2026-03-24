from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_opponents() -> dict:
    # TODO: proxy to opponent service
    return {"opponents": []}


@router.get("/daily-digest")
async def daily_digest() -> dict:
    return {"digest": []}
