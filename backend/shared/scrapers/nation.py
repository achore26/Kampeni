"""Nation Media Group — nation.africa (largest Kenyan media group).

Native RSS at https://nation.africa/kenya/rss.xml — works, returns full entries.
Direct article fetching returns 403 (bot protection) — content is limited to RSS summary.

NOTE: Full-content scraping is blocked by nation.africa's bot protection (HTTP 403).
Content is limited to what the RSS feed provides (~80-100 chars per entry).
Deferred: could be resolved with Playwright rendering or a paid scraping proxy.
"""
from __future__ import annotations

from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss


class NationScraper(BaseScraper):
    source_name = "nation"
    rss_url = "https://nation.africa/kenya/rss.xml"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        return await fetch_rss(self.rss_url, self.source_name, limit)
