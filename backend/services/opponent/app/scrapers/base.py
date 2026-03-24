"""Base scraper class. All media scrapers inherit from this."""
import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime

import httpx


@dataclass
class Article:
    url: str
    title: str
    content: str
    published_at: datetime
    source: str
    author: str = ""
    tags: list[str] = field(default_factory=list)


class BaseScraper(ABC):
    """RSS-first, HTML-scrape fallback. Always check robots.txt before scraping."""

    source_name: str
    rss_url: str | None = None
    base_url: str = ""

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            headers={"User-Agent": "KampeniBot/1.0 (+https://kampeni.co.ke/bot)"},
            timeout=30.0,
            follow_redirects=True,
        )

    @abstractmethod
    async def fetch_recent(self, limit: int = 50) -> list[Article]:
        """Fetch most recent articles. Prefer RSS; fall back to HTML scraping."""
        ...

    async def close(self) -> None:
        await self._client.aclose()
