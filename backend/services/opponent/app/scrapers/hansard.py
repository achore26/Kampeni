"""Hansard scraper — Parliament of Kenya.

Source: http://parliament.go.ke/the-national-assembly/house-business/hansard
Access: HTML scraping + PDF parsing
Update cadence: Weekly (Hansard is published after each sitting day)
"""
from .base import Article, BaseScraper


class HansardScraper(BaseScraper):
    source_name = "hansard"
    base_url = "http://parliament.go.ke"

    async def fetch_recent(self, limit: int = 20) -> list[Article]:
        # TODO: scrape index page, download PDFs, parse with pdfminer/pypdf
        raise NotImplementedError("Implement in Month 3")
