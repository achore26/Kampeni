"""Royal Media Services — citizen.digital (widest broadcast reach in Kenya)."""
from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss


class CitizenScraper(BaseScraper):
    source_name = "citizen"
    rss_url = "https://www.citizen.digital/rss"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        return await fetch_rss(self.rss_url, self.source_name, limit)
