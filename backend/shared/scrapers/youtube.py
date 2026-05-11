"""YouTube Data API v3 scraper.

Fetches Kenyan political video metadata and top comments.

Two content types are ingested:
  - Videos   → source="youtube"         url=watch URL, content=description
  - Comments → source="youtube_comment"  url=watch URL, content=comment text

This separation lets sentiment classification run independently on video
descriptions (editorial framing) vs comments (public reaction).

Quota budget (free tier = 10,000 units/day):
  - search.list  = 100 units per call → run 8 queries = 800 units
  - commentThreads.list = 1 unit per call → 100 videos × 1 = 100 units
  Daily spend: ~900 units — well within the 10,000 free limit.

If YOUTUBE_API_KEY is not set the scraper returns an empty list silently.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from .base import BaseScraper, ScrapedArticle

logger = logging.getLogger(__name__)

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

# Search queries focused on Kenyan political content
SEARCH_QUERIES = [
    "Kenya politics 2025",
    "Kenya government parliament",
    "Kenya elections county",
    "Kenya economy corruption",
    "Nairobi politics Kenya",
    "Kenya hustler opposition",
    "Kenya budget tax",
    "Kenya security news",
]

# Max videos to fetch per search query
VIDEOS_PER_QUERY = 5
# Max comments to fetch per video
COMMENTS_PER_VIDEO = 20


class YouTubeScraper(BaseScraper):
    source_name = "youtube"

    def __init__(self, api_key: str) -> None:
        super().__init__()
        self._api_key = api_key

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        if not self._api_key:
            logger.warning("YOUTUBE_API_KEY not set — skipping YouTube scraper")
            return []

        articles: list[ScrapedArticle] = []
        seen_video_ids: set[str] = set()

        for query in SEARCH_QUERIES:
            try:
                videos = await self._search_videos(query, max_results=VIDEOS_PER_QUERY)
            except Exception as exc:
                logger.error("YouTube search failed for query '%s': %s", query, exc)
                continue

            for video in videos:
                vid_id = video["id"]
                if vid_id in seen_video_ids:
                    continue
                seen_video_ids.add(vid_id)

                watch_url = f"https://www.youtube.com/watch?v={vid_id}"
                published_at = _parse_iso(video.get("publishedAt"))

                # Video article — description as content
                description = video.get("description", "").strip()
                if description:
                    articles.append(ScrapedArticle(
                        url=watch_url,
                        title=video.get("title", "").strip(),
                        content=description[:3000],
                        published_at=published_at,
                        source="youtube",
                        author=video.get("channelTitle", ""),
                        tags=["youtube", "video"],
                    ))

                # Comment articles — one per top comment
                try:
                    comments = await self._fetch_comments(vid_id, max_results=COMMENTS_PER_VIDEO)
                    for comment in comments:
                        text = comment.get("text", "").strip()
                        if not text or len(text) < 10:
                            continue
                        articles.append(ScrapedArticle(
                            url=watch_url,
                            title=video.get("title", "").strip(),
                            content=text[:1000],
                            published_at=_parse_iso(comment.get("publishedAt")) or published_at,
                            source="youtube_comment",
                            author=comment.get("authorDisplayName", ""),
                            tags=["youtube", "comment"],
                        ))
                except Exception as exc:
                    logger.debug("Comment fetch failed for video %s: %s", vid_id, exc)

            if len(articles) >= limit * 3:  # comments multiply count, cap early
                break

        return articles

    async def _search_videos(self, query: str, max_results: int = 5) -> list[dict]:
        """Call search.list and return list of video metadata dicts."""
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "regionCode": "KE",
            "relevanceLanguage": "en",
            "maxResults": max_results,
            "order": "date",
            "key": self._api_key,
        }
        response = await self._client.get(f"{YOUTUBE_API_BASE}/search", params=params, timeout=15.0)
        response.raise_for_status()
        data = response.json()

        videos = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            vid_id = item.get("id", {}).get("videoId")
            if not vid_id:
                continue
            videos.append({
                "id": vid_id,
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "channelTitle": snippet.get("channelTitle", ""),
                "publishedAt": snippet.get("publishedAt"),
            })
        return videos

    async def _fetch_comments(self, video_id: str, max_results: int = 20) -> list[dict]:
        """Call commentThreads.list and return top-level comment dicts."""
        params = {
            "part": "snippet",
            "videoId": video_id,
            "maxResults": max_results,
            "order": "relevance",
            "key": self._api_key,
        }
        response = await self._client.get(
            f"{YOUTUBE_API_BASE}/commentThreads", params=params, timeout=15.0
        )
        if response.status_code == 403:
            # Comments disabled on this video — skip silently
            return []
        response.raise_for_status()
        data = response.json()

        comments = []
        for item in data.get("items", []):
            top = item.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
            text = top.get("textDisplay", "").strip()
            if text:
                comments.append({
                    "text": text,
                    "authorDisplayName": top.get("authorDisplayName", ""),
                    "publishedAt": top.get("publishedAt"),
                    "likeCount": top.get("likeCount", 0),
                })
        return comments


def _parse_iso(date_str: str | None) -> datetime:
    if not date_str:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)
