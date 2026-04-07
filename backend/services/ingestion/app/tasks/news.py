"""News ingestion pipeline.

Flow: RSS scrapers → S3/MinIO (raw storage) → deduplicate → PostgreSQL → Redis queue for sentiment.

Every article is stored raw in object storage first, then structured metadata
goes to Postgres. This separation means:
  - Raw data is always preserved regardless of schema changes
  - Translation service can process raw objects directly from S3
  - Language-agnostic: raw text stored as-is, translation happens downstream
"""
from __future__ import annotations

import asyncio
import json
import logging

import redis as redis_sync
from langdetect import detect, LangDetectException

from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import Article
from shared.models import SentimentRecord  # noqa: F401 — registers mapper
from shared.scrapers import NationScraper, StandardScraper, CitizenScraper
from shared import storage

from ..worker import celery_app

logger = logging.getLogger(__name__)
REDIS_PENDING_KEY = "articles:pending"


def _ensure_tables() -> None:
    Base.metadata.create_all(bind=sync_engine)


def _detect_language(text: str) -> str:
    """Detect language of text. Returns ISO 639-1 code, defaults to 'en'."""
    try:
        return detect(text) if text and len(text.strip()) > 20 else "en"
    except LangDetectException:
        return "en"


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def ingest_all_news(self) -> dict:  # type: ignore[override]
    """Fetch RSS articles, store raw to MinIO, save metadata to Postgres, queue for sentiment."""
    _ensure_tables()

    # Ensure MinIO bucket exists
    try:
        storage.ensure_bucket()
    except Exception as exc:
        logger.warning("Could not connect to object storage: %s — continuing without raw storage", exc)

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

            # Detect language of raw content
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

            # Store raw article to object storage (best effort — don't fail ingestion if storage is down)
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
                # Queue non-English/Swahili articles for translation
                if language not in ("en", "sw"):
                    translation_queue_items.append(json.dumps({
                        "article_id": str(record.id),
                        "raw_key": key,
                    }))
            except Exception as exc:
                logger.warning("Failed to store raw article %s to object storage: %s", record.id, exc)

            new_ids.append(str(record.id))
            saved += 1

        db.commit()

    logger.info("Ingestion complete: saved=%d, skipped=%d, raw_stored=%d", saved, skipped, raw_stored)

    if new_ids:
        r = redis_sync.from_url(settings.redis_url, decode_responses=True)
        pipe = r.pipeline()
        for article_id in new_ids:
            pipe.rpush(REDIS_PENDING_KEY, article_id)
        pipe.execute()
        r.close()
        logger.info("Queued %d articles for sentiment", len(new_ids))

    # Enqueue non-English/Swahili articles for translation
    translation_queued = 0
    if translation_queue_items:
        r = redis_sync.from_url(settings.redis_url, decode_responses=True)
        pipe = r.pipeline()
        for item in translation_queue_items:
            pipe.rpush("articles:translate:pending", item)
        pipe.execute()
        r.close()
        translation_queued = len(translation_queue_items)
        logger.info("Queued %d articles for translation", translation_queued)

    return {"saved": saved, "skipped": skipped, "raw_stored": raw_stored, "translation_queued": translation_queued}
