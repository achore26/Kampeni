from fastapi import APIRouter

router = APIRouter()


@router.post("/run/{source}")
async def trigger_scrape(source: str) -> dict:
    # TODO: trigger on-demand scrape for a named source
    valid_sources = ["nation", "standard", "citizen", "hansard"]
    if source not in valid_sources:
        return {"error": f"Unknown source: {source}. Valid: {valid_sources}"}
    return {"status": "queued", "source": source}
