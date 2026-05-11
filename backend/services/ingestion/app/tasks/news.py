"""News ingestion — called directly by the trigger router.

No Celery. Prefect schedules this via POST /trigger/news every 30 minutes.

Flow: RSS scrapers + YouTube → MinIO (raw) → deduplicate → PostgreSQL → Redis queues
"""
from __future__ import annotations

import asyncio
import json
import logging

import redis as redis_sync
from langdetect import detect, LangDetectException

from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import Article, SentimentRecord  # noqa: F401
from shared.scrapers import NationScraper, StandardScraper, CitizenScraper, CapitalFMScraper, KBCScraper, YouTubeScraper
from shared import storage

logger = logging.getLogger(__name__)
REDIS_PENDING_KEY = "articles:pending"


def _ensure_tables() -> None:
    Base.metadata.create_all(bind=sync_engine)


def _detect_language(text: str) -> str:
    if not text or len(text.strip()) < 20:
        return "en"
    try:
        result = detect(text)
        return result if result else "en"
    except LangDetectException:
        return "en"
    except Exception:
        return "en"


def ingest_all_news() -> dict:
    """Fetch RSS + YouTube articles, store raw to MinIO, save to Postgres, queue for sentiment."""
    _ensure_tables()
    settings = get_settings()

    try:
        storage.ensure_bucket()
    except Exception as exc:
        logger.warning("Could not connect to object storage: %s — continuing without raw storage", exc)

    async def _fetch_all() -> list:
        scrapers = [
            NationScraper(),
            StandardScraper(),
            CitizenScraper(),
            CapitalFMScraper(),
            KBCScraper(),
            YouTubeScraper(api_key=settings.youtube_api_key),
        ]
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
        raise

    if not articles:
        return {"saved": 0, "skipped": 0}

    new_ids: list[str] = []
    translation_queue_items: list[str] = []
    saved = skipped = raw_stored = 0

    with SyncSessionLocal() as db:
        for art in articles:
            if not art.url or not art.title:
                continue

            exists = db.query(Article).filter(Article.url == art.url).first()
            if exists:
                skipped += 1
                continue

            raw_text = f"{art.title} {art.content or ''}"
            language = _detect_language(raw_text)

            record = Article(
                url=art.url,
                title=art.title,
                content=art.content or "",
                source=art.source,
                author=art.author or None,
                language=language,
                published_at=art.published_at,
                tags=art.tags or [],
            )
            db.add(record)
            db.flush()

            try:
                key = storage.article_key(art.source, str(record.id), art.published_at)
                storage.put_object(key, {
                    "id": str(record.id),
                    "url": art.url,
                    "title": art.title,
                    "content": art.content or "",
                    "source": art.source,
                    "author": art.author or "",
                    "language_detected": language,
                    "published_at": art.published_at.isoformat() if art.published_at else None,
                    "tags": art.tags or [],
                    "translation_status": "pending" if language not in ("en", "sw") else "not_required",
                })
                raw_stored += 1
                if language not in ("en", "sw"):
                    translation_queue_items.append(json.dumps({
                        "article_id": str(record.id),
                        "raw_key": key,
                    }))
            except Exception as exc:
                logger.warning("Failed to store raw article %s: %s", record.id, exc)

            new_ids.append(str(record.id))
            saved += 1

        db.commit()

    logger.info("News ingestion: saved=%d, skipped=%d, raw_stored=%d", saved, skipped, raw_stored)

    if new_ids:
        r = redis_sync.from_url(settings.redis_url, decode_responses=True)
        pipe = r.pipeline()
        for article_id in new_ids:
            pipe.rpush(REDIS_PENDING_KEY, article_id)
        for item in translation_queue_items:
            pipe.rpush("articles:translate:pending", item)
        pipe.execute()
        r.close()
        logger.info("Queued %d articles for sentiment, %d for translation", len(new_ids), len(translation_queue_items))

    return {"saved": saved, "skipped": skipped, "raw_stored": raw_stored, "translation_queued": len(translation_queue_items)}
