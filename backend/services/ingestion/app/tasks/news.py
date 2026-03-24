"""News ingestion pipeline.

Flow: RSS scrapers → deduplicate → PostgreSQL → Redis queue for sentiment.
"""
from __future__ import annotations

import asyncio
import logging

import redis as redis_sync

from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import Article
from shared.models import SentimentRecord  # noqa: F401 — registers mapper
from shared.scrapers import CitizenScraper, NationScraper, StandardScraper

from ..worker import celery_app

logger = logging.getLogger(__name__)
REDIS_PENDING_KEY = "articles:pending"


def _ensure_tables() -> None:
    Base.metadata.create_all(bind=sync_engine)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def ingest_all_news(self) -> dict:  # type: ignore[override]
    """Fetch RSS articles, save new ones, queue for sentiment classification."""
    _ensure_tables()

    async def _fetch_all() -> list:
        scrapers = [NationScraper(), StandardScraper(), CitizenScraper()]
        results = await asyncio.gather(
            *[s.fetch_recent(limit=50) for s in scrapers],
            return_exceptions=True,
        )
        for s in scrapers:
            await s.close()
        all_articles = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error("Scraper %d failed: %s", i, result)
            else:
                all_articles.extend(result)
        return all_articles

    try:
        articles = asyncio.run(_fetch_all())
    except Exception as exc:
        logger.error("Failed to fetch articles: %s", exc)
        raise self.retry(exc=exc)

    if not articles:
        return {"saved": 0, "skipped": 0}

    settings = get_settings()
    new_ids: list[str] = []
    saved = skipped = 0

    with SyncSessionLocal() as db:
        for art in articles:
            if not art.url or not art.title:
                continue
            exists = db.query(Article).filter(Article.url == art.url).first()
            if exists:
                skipped += 1
                continue
            record = Article(
                url=art.url,
                title=art.title,
                content=art.content or "",
                source=art.source,
                author=art.author or None,
                published_at=art.published_at,
                tags=art.tags or [],
            )
            db.add(record)
            db.flush()
            new_ids.append(str(record.id))
            saved += 1
        db.commit()

    logger.info("Ingestion complete: saved=%d, skipped=%d", saved, skipped)

    if new_ids:
        r = redis_sync.from_url(settings.redis_url, decode_responses=True)
        pipe = r.pipeline()
        for article_id in new_ids:
            pipe.rpush(REDIS_PENDING_KEY, article_id)
        pipe.execute()
        r.close()
        logger.info("Queued %d articles for sentiment", len(new_ids))

    return {"saved": saved, "skipped": skipped}
