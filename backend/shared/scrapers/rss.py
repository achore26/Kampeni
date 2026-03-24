"""Shared RSS parsing utility using feedparser."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser

from .base import ScrapedArticle


def _safe_parse_date(date_str: str | None) -> datetime:
    if not date_str:
        return datetime.now(timezone.utc)
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        return datetime.now(timezone.utc)


async def fetch_rss(url: str, source_name: str, limit: int = 50) -> list[ScrapedArticle]:
    """Parse an RSS feed asynchronously."""
    loop = asyncio.get_event_loop()
    feed = await loop.run_in_executor(None, feedparser.parse, url)

    articles: list[ScrapedArticle] = []
    for entry in feed.entries[:limit]:
        link = entry.get("link", "")
        if not link:
            continue
        content = (
            (entry.get("content") or [{}])[0].get("value", "")
            or entry.get("summary", "")
            or entry.get("description", "")
            or ""
        )
        articles.append(
            ScrapedArticle(
                url=link,
                title=(entry.get("title") or "").strip(),
                content=content.strip(),
                published_at=_safe_parse_date(entry.get("published")),
                source=source_name,
                author=entry.get("author", ""),
                tags=[t.get("term", "") for t in (entry.get("tags") or []) if t.get("term")],
            )
        )
    return articles
