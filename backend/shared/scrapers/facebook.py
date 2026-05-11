"""Facebook Graph API scraper — public page posts.

Uses Meta Graph API v20.0 (free tier).
Requires META_ACCESS_TOKEN in .env — a long-lived Page or User access token.

What we monitor:
  - Opponent public Facebook pages (page IDs stored in opponent_profiles)
  - Constituency / ward community pages
  - Political party pages

The page_ids to scrape are passed in at call time so the same scraper
serves both the news pipeline (media pages) and the opponent tracker.

Rate limits (free tier):
  - 200 calls/hour per access token
  - Each call fetches up to 100 posts
  - Well within budget for polling ~20 pages every 30 minutes
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from .base import BaseScraper, ScrapedArticle

logger = logging.getLogger(__name__)

GRAPH_BASE = "https://graph.facebook.com/v20.0"
POST_FIELDS = "id,message,story,created_time,permalink_url"


class FacebookScraper(BaseScraper):
    """Fetch recent public posts from a list of Facebook page IDs."""

    source_name = "facebook"

    def __init__(self, access_token: str, page_ids: list[str]) -> None:
        super().__init__()
        if not access_token:
            raise ValueError(
                "META_ACCESS_TOKEN is not set. "
                "Generate a long-lived token from the Meta Developer Console "
                "and add it to .env."
            )
        self._token = access_token
        self._page_ids = page_ids

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        articles: list[ScrapedArticle] = []
        per_page = min(limit, 100)  # Graph API max per request

        for page_id in self._page_ids:
            try:
                posts = await self._fetch_page_posts(page_id, per_page)
                articles.extend(posts)
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 190:
                    # Token expired or invalid
                    logger.error(
                        "Facebook access token is invalid or expired (page %s). "
                        "Regenerate META_ACCESS_TOKEN in .env.",
                        page_id,
                    )
                elif exc.response.status_code == 200:
                    # Graph API errors are sometimes returned as HTTP 200
                    logger.error("Graph API error for page %s: %s", page_id, exc.response.text)
                else:
                    logger.warning("HTTP %s fetching page %s: %s",
                                   exc.response.status_code, page_id, exc)
            except Exception as exc:
                logger.warning("Failed to fetch Facebook page %s: %s", page_id, exc)

        return articles

    async def _fetch_page_posts(self, page_id: str, limit: int) -> list[ScrapedArticle]:
        url = f"{GRAPH_BASE}/{page_id}/posts"
        params = {
            "fields": POST_FIELDS,
            "limit": limit,
            "access_token": self._token,
        }

        resp = await self._client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

        # Graph API wraps results in {"data": [...], "paging": {...}}
        posts = data.get("data", [])
        articles: list[ScrapedArticle] = []

        for post in posts:
            message = post.get("message") or post.get("story") or ""
            if not message.strip():
                continue  # skip posts with no text (photo-only, check-ins, etc.)

            permalink = post.get("permalink_url", "")
            if not permalink:
                permalink = f"https://www.facebook.com/{page_id}/posts/{post['id'].split('_')[-1]}"

            created_raw = post.get("created_time", "")
            try:
                published_at = datetime.fromisoformat(
                    created_raw.replace("Z", "+00:00")
                )
            except (ValueError, AttributeError):
                published_at = datetime.now(timezone.utc)

            # Use first 100 chars of message as title (FB posts have no title field)
            title = message[:100].strip()
            if len(message) > 100:
                title += "…"

            articles.append(ScrapedArticle(
                url=permalink,
                title=title,
                content=message,
                source=f"facebook:{page_id}",
                published_at=published_at,
                tags=["facebook", "social"],
            ))

        return articles
