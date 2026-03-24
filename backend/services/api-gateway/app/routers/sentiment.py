from fastapi import APIRouter

router = APIRouter()


@router.get("/dashboard")
async def sentiment_dashboard() -> dict:
    # TODO: proxy to sentiment service
    return {"message": "sentiment dashboard — proxies to sentiment service"}


@router.get("/wards")
async def ward_sentiment() -> dict:
    return {"wards": []}
