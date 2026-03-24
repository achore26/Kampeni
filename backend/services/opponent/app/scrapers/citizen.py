"""Royal Media Services scraper — Citizen Digital, Citizen TV."""
from .base import Article, BaseScraper


class CitizenScraper(BaseScraper):
    source_name = "citizen"
    rss_url = "https://www.citizen.digital/rss"
    base_url = "https://www.citizen.digital"

    async def fetch_recent(self, limit: int = 50) -> list[Article]:
        raise NotImplementedError("Implement in Month 3")
