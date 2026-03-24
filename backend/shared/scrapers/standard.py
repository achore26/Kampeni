"""Standard Group — standardmedia.co.ke, KTN News."""
from .base import BaseScraper, ScrapedArticle
from .rss import fetch_rss


class StandardScraper(BaseScraper):
    source_name = "standard"
    rss_url = "https://www.standardmedia.co.ke/rss/kenya.xml"

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        return await fetch_rss(self.rss_url, self.source_name, limit)
