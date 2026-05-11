"""KBC Digital — kbc.co.ke (Kenya Broadcasting Corporation).

State broadcaster; wide reach particularly in rural areas and Kiswahili coverage.
Native RSS with full content:encoded — no additional fetching needed.
WordPress-powered site; content comes through in the RSS feed directly.
"""
from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss


class KBCScraper(BaseScraper):
    source_name = "kbc"
    rss_url = "https://www.kbc.co.ke/feed/"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        return await fetch_rss(self.rss_url, self.source_name, limit)
