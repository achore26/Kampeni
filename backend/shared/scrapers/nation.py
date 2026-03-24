"""Nation Media Group — nation.africa (largest Kenyan media group)."""
from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss


class NationScraper(BaseScraper):
    source_name = "nation"
    rss_url = "https://nation.africa/kenya/rss.xml"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        return await fetch_rss(self.rss_url, self.source_name, limit)
