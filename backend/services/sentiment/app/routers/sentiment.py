"""Sentiment API — backed by real PostgreSQL data."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import Article, SentimentRecord

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


class SentimentRequest(BaseModel):
    text: str
    language: str = "auto"


class SentimentResponse(BaseModel):
    text: str
    label: str
    score: float
    language_detected: str


class ArticleSentimentOut(BaseModel):
    article_id: str
    url: str
    title: str
    source: str
    published_at: str | None
    label: str
    score: float
    language_detected: str


class SentimentBreakdown(BaseModel):
    positive: int = 0
    negative: int = 0
    neutral: int = 0
    total: int = 0


@router.post("/classify", response_model=SentimentResponse)
async def classify_sentiment(request: SentimentRequest) -> SentimentResponse:
    from ..nlp.classifier import SentimentClassifier
    result = SentimentClassifier().classify(request.text)
    return SentimentResponse(
        text=request.text,
        label=result.label,
        score=result.score,
        language_detected=result.language,
    )


@router.get("/articles", response_model=list[ArticleSentimentOut])
async def list_article_sentiments(
    db: DbSession,
    source: str | None = Query(None),
    label: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
) -> list[ArticleSentimentOut]:
    stmt = (
        select(Article, SentimentRecord)
        .join(SentimentRecord, SentimentRecord.article_id == Article.id)
        .order_by(Article.published_at.desc().nullslast())
        .limit(limit)
        .offset(offset)
    )
    if source:
        stmt = stmt.where(Article.source == source)
    if label:
        stmt = stmt.where(SentimentRecord.label == label)

    result = await db.execute(stmt)
    return [
        ArticleSentimentOut(
            article_id=str(art.id),
            url=art.url,
            title=art.title,
            source=art.source,
            published_at=art.published_at.isoformat() if art.published_at else None,
            label=sent.label,
            score=sent.score,
            language_detected=sent.language_detected,
        )
        for art, sent in result.all()
    ]


@router.get("/summary", response_model=SentimentBreakdown)
async def get_sentiment_summary(
    db: DbSession,
    source: str | None = Query(None),
) -> SentimentBreakdown:
    stmt = select(SentimentRecord.label, func.count(SentimentRecord.id)).group_by(
        SentimentRecord.label
    )
    if source:
        stmt = stmt.join(Article, Article.id == SentimentRecord.article_id).where(
            Article.source == source
        )
    result = await db.execute(stmt)
    breakdown: dict[str, int] = {row[0]: row[1] for row in result.all()}
    total = sum(breakdown.values())
    return SentimentBreakdown(
        positive=breakdown.get("positive", 0),
        negative=breakdown.get("negative", 0),
        neutral=breakdown.get("neutral", 0),
        total=total,
    )


@router.get("/dashboard/{candidate_id}")
async def get_sentiment_dashboard(candidate_id: str, db: DbSession) -> dict:
    stmt = (
        select(SentimentRecord.label, func.count(SentimentRecord.id))
        .where(SentimentRecord.candidate_id == candidate_id)
        .group_by(SentimentRecord.label)
    )
    result = await db.execute(stmt)
    breakdown = {row[0]: row[1] for row in result.all()}
    return {
        "candidate_id": candidate_id,
        "total_articles": sum(breakdown.values()),
        "breakdown": breakdown,
        "sentiment_timeline": [],
        "ward_map": [],
        "top_issues": [],
    }
