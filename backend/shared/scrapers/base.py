"""Base scraper class — all RSS/HTML scrapers inherit from this."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime

import httpx


@dataclass
class ScrapedArticle:
    url: str
    title: str
    content: str
    published_at: datetime
    source: str
    author: str = ""
    tags: list[str] = field(default_factory=list)


class BaseScraper(ABC):
    """RSS-first scraper. Respects robots.txt — use RSS where available."""

    source_name: str
    rss_url: str | None = None
    base_url: str = ""

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            headers={"User-Agent": "KampeniBot/1.0 (+https://kampeni.net/bot)"},
            timeout=30.0,
            follow_redirects=True,
        )

    @abstractmethod
    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        """Fetch most recent articles."""
        ...

    async def close(self) -> None:
        await self._client.aclose()
