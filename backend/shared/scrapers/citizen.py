"""Royal Media Services — citizen.digital (widest broadcast reach in Kenya).

Native RSS (https://www.citizen.digital/rss) returned 401 as of 2026-04 — feed is behind auth.
Using Google News RSS proxy which indexes Citizen Digital articles in real time.
Swap back to native URL if Citizen restores public RSS access.
"""
from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss


class CitizenScraper(BaseScraper):
    source_name = "citizen"
    rss_url = "https://news.google.com/rss/search?q=site:citizen.digital&hl=en-KE&gl=KE&ceid=KE:en"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        return await fetch_rss(self.rss_url, self.source_name, limit)
