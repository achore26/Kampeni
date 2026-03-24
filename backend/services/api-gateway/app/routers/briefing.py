from fastapi import APIRouter

router = APIRouter()


@router.get("/latest")
async def latest_briefing() -> dict:
    # TODO: proxy to briefing service
    return {"briefing": None}


@router.get("/history")
async def briefing_history() -> dict:
    return {"briefings": []}
