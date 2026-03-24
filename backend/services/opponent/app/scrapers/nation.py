"""Nation Media Group scraper — Nation.co.ke, NTV, Business Daily.

Access method: RSS feeds (preferred) + HTML scraping of public pages.
Update cadence: Every 15 minutes during business hours.
"""
from .base import Article, BaseScraper


class NationScraper(BaseScraper):
    source_name = "nation"
    rss_url = "https://nation.africa/kenya/rss.xml"
    base_url = "https://nation.africa"

    async def fetch_recent(self, limit: int = 50) -> list[Article]:
        # TODO: parse RSS feed with feedparser; fall back to HTML scraping
        raise NotImplementedError("Implement in Month 3")
