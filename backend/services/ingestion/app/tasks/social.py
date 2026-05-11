"""Social media ingestion tasks — called directly by the trigger router.

No Celery. Prefect schedules this via POST /trigger/social every 60 minutes.

Three Facebook strategies in priority order:
  1. FacebookPageScraper (Playwright) — scrapes public pages with a real browser.
     No credentials needed. Activated when FB_PAGE_URLS is set.
  2. FacebookForager (Playwright) — keyword searches for political topics and
     citizen painpoints. Requires FB_EMAIL + FB_PASSWORD.
  3. FacebookScraper (Graph API) — legacy, only useful if META_ACCESS_TOKEN is set
     AND you are an admin of the target pages. Kept as fallback.

X/Twitter is out — no free API tier (decision: April 2026).
"""
from __future__ import annotations

import asyncio
import json
import logging

import redis as redis_sync

from shared.config import get_settings
from shared.database import Base, SyncSessionLocal, sync_engine
from shared.models import Article
from shared.models import OpponentProfile, SentimentRecord  # noqa: F401 — registers mappers
from shared.scrapers import FacebookScraper, FacebookPageScraper, FacebookForager
from shared import storage

logger = logging.getLogger(__name__)
REDIS_PENDING_KEY = "articles:pending"
REDIS_TRANSLATE_KEY = "articles:translate:pending"  # translation → painpoint pipeline


def _save_posts(posts: list, label: str) -> dict:
    """Deduplicate, persist to Postgres + MinIO, queue for sentiment."""
    if not posts:
        return {"saved": 0, "skipped": 0, "raw_stored": 0}

    Base.metadata.create_all(bind=sync_engine)
    try:
        storage.ensure_bucket()
    except Exception as exc:
        logger.warning("Object storage unavailable: %s — continuing", exc)

    saved = skipped = raw_stored = 0
    new_ids: list[str] = []
    painpoint_translate_items: list[str] = []  # JSON payloads for articles:translate:pending

    with SyncSessionLocal() as db:
        for post in posts:
            if not post.url or not post.title:
                continue

            exists = db.query(Article).filter(Article.url == post.url).first()
            if exists:
                skipped += 1
                continue

            record = Article(
                url=post.url,
                title=post.title,
                content=post.content or "",
                source=post.source,
                language="sw",
                published_at=post.published_at,
                tags=post.tags or [],
            )
            db.add(record)
            db.flush()

            raw_key = ""
            try:
                raw_key = storage.article_key(post.source, str(record.id), post.published_at)
                storage.put_object(raw_key, {
                    "id": str(record.id),
                    "url": post.url,
                    "title": post.title,
                    "content": post.content or "",
                    "source": post.source,
                    "language_detected": "sw",
                    "published_at": post.published_at.isoformat() if post.published_at else None,
                    "tags": post.tags or [],
                    "translation_status": "pending",
                })
                raw_stored += 1
            except Exception as exc:
                logger.warning("Failed to store post %s to object storage: %s", record.id, exc)

            new_ids.append(str(record.id))
            # Route painpoint-tagged posts through translation pipeline.
            # Translation service handles sw/en pass-through and pushes the
            # correctly-structured payload to articles:painpoint:pending.
            if "painpoint" in (post.tags or []) and raw_key:
                painpoint_translate_items.append(json.dumps({
                    "article_id": str(record.id),
                    "raw_key": raw_key,
                }))
            saved += 1

        db.commit()

    logger.info("%s ingestion: saved=%d, skipped=%d, raw_stored=%d", label, saved, skipped, raw_stored)

    settings = get_settings()
    if new_ids:
        r = redis_sync.from_url(settings.redis_url, decode_responses=True)
        pipe = r.pipeline()
        for article_id in new_ids:
            pipe.rpush(REDIS_PENDING_KEY, article_id)
        for item in painpoint_translate_items:
            pipe.rpush(REDIS_TRANSLATE_KEY, item)
        pipe.execute()
        r.close()
        logger.info("Queued %d posts for sentiment, %d for translation→painpoint", len(new_ids), len(painpoint_translate_items))

    return {"saved": saved, "skipped": skipped, "raw_stored": raw_stored}


# ─── Task 1: Playwright page scraper ────────────────────────────────────────

def ingest_facebook_pages() -> dict:
    """Scrape recent posts from public Kenyan political Facebook pages using Playwright."""
    settings = get_settings()

    page_urls = [u.strip() for u in settings.fb_page_urls.split(",") if u.strip()]
    if not page_urls:
        page_urls = None  # type: ignore[assignment]

    async def _fetch() -> list:
        scraper = FacebookPageScraper(page_urls=page_urls)
        try:
            return await scraper.fetch_recent(limit=60)
        finally:
            await scraper.close()

    try:
        posts = asyncio.run(_fetch())
    except Exception as exc:
        logger.error("FacebookPageScraper failed: %s", exc)
        return {"saved": 0, "skipped": 0, "error": str(exc)}

    return _save_posts(posts, "FacebookPages")


# ─── Task 2: Playwright forager (keyword search) ─────────────────────────────

def ingest_facebook_forager() -> dict:
    """Search Facebook for political topics and citizen painpoints using Playwright."""
    settings = get_settings()

    if not settings.fb_email or not settings.fb_password:
        logger.warning(
            "FB_EMAIL or FB_PASSWORD not set — skipping FacebookForager. "
            "Add a Facebook account to .env to enable keyword search."
        )
        return {"saved": 0, "skipped": 0, "reason": "no_credentials"}

    async def _fetch() -> list:
        scraper = FacebookForager(
            email=settings.fb_email,
            password=settings.fb_password,
        )
        try:
            return await scraper.fetch_recent(limit=100)
        finally:
            await scraper.close()

    try:
        posts = asyncio.run(_fetch())
    except Exception as exc:
        logger.error("FacebookForager failed: %s", exc)
        return {"saved": 0, "skipped": 0, "error": str(exc)}

    return _save_posts(posts, "FacebookForager")


# ─── Task 3: Graph API (legacy fallback) ─────────────────────────────────────

def _get_page_ids() -> list[str]:
    settings = get_settings()
    static = [p.strip() for p in settings.facebook_page_ids.split(",") if p.strip()]
    try:
        with SyncSessionLocal() as db:
            opponents = db.query(OpponentProfile).filter(
                OpponentProfile.twitter_handle.isnot(None),
                OpponentProfile.twitter_handle.like("fb:%"),
            ).all()
            opponent_pages = [o.twitter_handle.removeprefix("fb:") for o in opponents]
    except Exception as exc:
        logger.warning("Could not load opponent FB pages from DB: %s", exc)
        opponent_pages = []
    return list(dict.fromkeys(static + opponent_pages))


def ingest_facebook() -> dict:
    """Graph API fallback — only useful if you admin the target pages."""
    settings = get_settings()

    if not settings.meta_access_token:
        logger.info("META_ACCESS_TOKEN not set — skipping Graph API Facebook ingestion.")
        return {"saved": 0, "skipped": 0, "reason": "no_token"}

    page_ids = _get_page_ids()
    if not page_ids:
        return {"saved": 0, "skipped": 0, "reason": "no_pages"}

    async def _fetch() -> list:
        scraper = FacebookScraper(access_token=settings.meta_access_token, page_ids=page_ids)
        try:
            return await scraper.fetch_recent(limit=50)
        finally:
            await scraper.close()

    try:
        posts = asyncio.run(_fetch())
    except Exception as exc:
        logger.error("Facebook Graph API fetch failed: %s", exc)
        return {"saved": 0, "skipped": 0, "error": str(exc)}

    return _save_posts(posts, "FacebookGraphAPI")
