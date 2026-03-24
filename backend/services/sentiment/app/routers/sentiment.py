from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SentimentRequest(BaseModel):
    text: str
    language: str = "auto"  # auto, sw, en, sheng


class SentimentResponse(BaseModel):
    text: str
    label: str  # positive, negative, neutral
    score: float
    language_detected: str


@router.post("/classify", response_model=SentimentResponse)
async def classify_sentiment(request: SentimentRequest) -> SentimentResponse:
    # TODO: run inference with fine-tuned Llama 3.1 8B / Helsinki-NLP
    return SentimentResponse(
        text=request.text,
        label="neutral",
        score=0.5,
        language_detected="en",
    )


@router.get("/dashboard/{candidate_id}")
async def get_sentiment_dashboard(candidate_id: str) -> dict:
    # TODO: query ClickHouse for time-series sentiment data
    return {
        "candidate_id": candidate_id,
        "sentiment_timeline": [],
        "ward_map": [],
        "top_issues": [],
        "platform_breakdown": {},
    }
