"""Standard Group — standardmedia.co.ke, KTN News.

Native RSS at /rss/kenya.xml returned 404 as of 2026-04.
We try several category-specific feeds before falling back to the Google News proxy.

Full-content scraping of standardmedia.co.ke is blocked by their login wall — content
will be limited to RSS summary text (~80–200 chars) unless a working native feed is found.
"""
from __future__ import annotations

import logging

from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss

logger = logging.getLogger(__name__)

# Ordered list of RSS feeds to try. First one that returns articles wins.
RSS_CANDIDATES = [
    "https://www.standardmedia.co.ke/rss/politics.xml",
    "https://www.standardmedia.co.ke/rss/kenya.xml",
    "https://www.standardmedia.co.ke/feed/",
    # Google News fallback — always works but content is limited to ~80 chars
    "https://news.google.com/rss/search?q=site:standardmedia.co.ke&hl=en-KE&gl=KE&ceid=KE:en",
]


class StandardScraper(BaseScraper):
    source_name = "standard"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        for feed_url in RSS_CANDIDATES:
            try:
                articles = await fetch_rss(feed_url, self.source_name, limit)
                if articles:
                    if "news.google.com" not in feed_url:
                        logger.info("Standard Media: using native feed %s (%d articles)", feed_url, len(articles))
                    return articles
            except Exception as exc:
                logger.debug("Standard RSS feed %s failed: %s", feed_url, exc)

        logger.warning("All Standard Media RSS feeds failed — returning empty")
        return []
