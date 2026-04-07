"""Standard Group — standardmedia.co.ke, KTN News.

Native RSS (https://www.standardmedia.co.ke/rss/kenya.xml) returned 404 as of 2026-04.
Using Google News RSS proxy which indexes Standard Media articles in real time.
Swap back to native URL if Standard restores their feed.
"""
from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss


class StandardScraper(BaseScraper):
    source_name = "standard"
    rss_url = "https://news.google.com/rss/search?q=site:standardmedia.co.ke&hl=en-KE&gl=KE&ceid=KE:en"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        return await fetch_rss(self.rss_url, self.source_name, limit)
