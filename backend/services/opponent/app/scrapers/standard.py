"""Standard Group scraper — StandardMedia.co.ke, KTN News."""
from .base import Article, BaseScraper


class StandardScraper(BaseScraper):
    source_name = "standard"
    rss_url = "https://www.standardmedia.co.ke/rss/kenya.xml"
    base_url = "https://www.standardmedia.co.ke"

    async def fetch_recent(self, limit: int = 50) -> list[Article]:
        raise NotImplementedError("Implement in Month 3")
