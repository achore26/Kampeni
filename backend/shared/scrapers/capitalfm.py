"""Capital FM Kenya — capitalfm.co.ke (Capital News).

Native RSS with full content:encoded — no additional fetching needed.
WordPress-powered site; content comes through in the RSS feed directly.
"""
from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss


class CapitalFMScraper(BaseScraper):
    source_name = "capitalfm"
    rss_url = "https://www.capitalfm.co.ke/news/feed/"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        return await fetch_rss(self.rss_url, self.source_name, limit)
