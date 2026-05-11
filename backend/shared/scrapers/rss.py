"""Shared RSS parsing utility using feedparser."""
from __future__ import annotations

import asyncio
import html
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser

import feedparser

from .base import ScrapedArticle


class _TextExtractor(HTMLParser):
    """Strips HTML tags and returns plain text."""
    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        stripped = data.strip()
        if stripped:
            self._parts.append(stripped)

    def get_text(self) -> str:
        return " ".join(self._parts)


def strip_html(text: str) -> str:
    """Remove HTML tags and decode entities from a string."""
    if not text or "<" not in text:
        return text
    extractor = _TextExtractor()
    extractor.feed(html.unescape(text))
    return extractor.get_text()


def _safe_parse_date(date_str: str | None) -> datetime:
    if not date_str:
        return datetime.now(timezone.utc)
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        return datetime.now(timezone.utc)


async def fetch_rss(url: str, source_name: str, limit: int = 50) -> list[ScrapedArticle]:
    """Parse an RSS feed and return clean, HTML-stripped articles."""
    loop = asyncio.get_event_loop()
    feed = await loop.run_in_executor(None, feedparser.parse, url)

    articles: list[ScrapedArticle] = []
    for entry in feed.entries[:limit]:
        link = entry.get("link", "")
        if not link:
            continue

        raw_content = (
            (entry.get("content") or [{}])[0].get("value", "")
            or entry.get("summary", "")
            or entry.get("description", "")
            or ""
        )

        articles.append(
            ScrapedArticle(
                url=link,
                title=strip_html((entry.get("title") or "").strip()),
                content=strip_html(raw_content.strip()),
                published_at=_safe_parse_date(entry.get("published")),
                source=source_name,
                author=entry.get("author", ""),
                tags=[t.get("term", "") for t in (entry.get("tags") or []) if t.get("term")],
            )
        )
    return articles
