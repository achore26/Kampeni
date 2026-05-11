"""Royal Media Services — citizen.digital (widest broadcast reach in Kenya).

Native RSS (https://www.citizen.digital/rss) returned 401 as of 2026-04 — feed is behind auth.
Using Google News RSS proxy which indexes Citizen Digital articles in real time.

NOTE: feedparser returns Google News redirect URLs (news.google.com/rss/articles/...) as
the entry link, not the real citizen.digital URL. These redirect via a JS splash page that
httpx cannot follow. Content is therefore limited to the RSS summary (~80 chars).
Full-content scraping is not feasible without JS rendering (Playwright/Selenium) — deferred.
"""
from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss


class CitizenScraper(BaseScraper):
    source_name = "citizen"
    rss_url = "https://news.google.com/rss/search?q=site:citizen.digital&hl=en-KE&gl=KE&ceid=KE:en"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        return await fetch_rss(self.rss_url, self.source_name, limit)
