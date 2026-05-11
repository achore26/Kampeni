"""Facebook scraper using Playwright (headless Chromium).

Two modes:
  1. FacebookPageScraper  — scrapes specific public Facebook pages. No login needed
     for pages that allow public access. Falls back gracefully if a login wall appears.

  2. FacebookForager — keyword/topic search across Facebook. Requires a Facebook
     account (FB_EMAIL + FB_PASSWORD in .env). Used to find political discussions
     and citizen painpoints that aren't on monitored pages.

Install deps:
  pip install playwright
  playwright install chromium

Bot detection notes:
  - We set a real browser viewport, language, and UA to blend in.
  - Random delays between actions simulate human timing.
  - Do NOT run with headless=False in production (defeats the purpose).
  - Facebook's bot detection improves over time — if requests start failing,
    consider adding playwright-stealth or a residential proxy.
"""
from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime, timezone

from .base import BaseScraper, ScrapedArticle

logger = logging.getLogger(__name__)

# ─── Known Kenyan political / media public Facebook pages ───────────────────
DEFAULT_PAGE_URLS: list[str] = [
    "https://www.facebook.com/NationAfrica",
    "https://www.facebook.com/standardmediagroup",
    "https://www.facebook.com/citizentvkenya",
    "https://www.facebook.com/KBCChannel1",
    "https://www.facebook.com/ntvkenya",
    "https://www.facebook.com/TheStarKenya",
    "https://www.facebook.com/kenyans.co.ke",
]

# ─── Forager query configs ───────────────────────────────────────────────────
# Each entry: (search_query, category_tag)
# category_tag is stored in ScrapedArticle.tags so downstream services can
# route painpoint posts to the painpoint service vs general sentiment.

POLITICAL_QUERIES: list[tuple[str, str]] = [
    ("Kenya politics 2025", "politics"),
    ("Kenya parliament debate", "politics"),
    ("Kenya county government MCA ward", "politics"),
    ("Kenya opposition hustler UDA ODM", "politics"),
    ("Nairobi politics corruption", "politics"),
    ("Kenya election 2027", "politics"),
    ("Kenya budget tax wananchi", "politics"),
]

PAINPOINT_QUERIES: list[tuple[str, str]] = [
    ("bei ya mafuta Kenya 2025", "painpoint"),           # fuel prices
    ("Kenya hospital dawa hakuna", "painpoint"),          # medicine shortage
    ("Kenya maji shortage county", "painpoint"),          # water shortage
    ("Kenya vijana unemployment jobs", "painpoint"),      # youth unemployment
    ("Kenya school fees harambee", "painpoint"),          # education costs
    ("Kenya corruption police county", "painpoint"),      # corruption
    ("Kenya economy wananchi hardship", "painpoint"),     # economic hardship
    ("Kenya roads infrastructure poor", "painpoint"),     # infrastructure
    ("Kenya NHIF insurance problems", "painpoint"),       # healthcare
    ("Kenya food prices unga maize", "painpoint"),        # food costs
]

# All forager queries combined
ALL_FORAGER_QUERIES = POLITICAL_QUERIES + PAINPOINT_QUERIES

# Selectors to try for post text — in priority order.
# Facebook's HTML is obfuscated so we try multiple stable attributes.
POST_TEXT_SELECTORS = [
    '[data-ad-comet-preview="message"]',
    '[data-ad-preview="message"]',
    'div[dir="auto"][style*="text-align"]',
    '[role="article"] div[dir="auto"]',
]


def _random_delay(min_s: float = 0.8, max_s: float = 2.5) -> float:
    return random.uniform(min_s, max_s)


async def _human_delay(min_s: float = 0.8, max_s: float = 2.5) -> None:
    await asyncio.sleep(_random_delay(min_s, max_s))


async def _dismiss_popups(page) -> None:
    """Close login/cookie prompts that block content."""
    close_selectors = [
        '[aria-label="Close"]',
        '[role="dialog"] button[aria-label="Close"]',
        'div[aria-label="Allow all cookies"] button',
        'button[data-cookiebanner="accept_button"]',
    ]
    for sel in close_selectors:
        try:
            btn = page.locator(sel).first
            if await btn.is_visible(timeout=1500):
                await btn.click()
                await _human_delay(0.3, 0.8)
        except Exception:
            pass


async def _extract_posts_from_page(page, source_label: str, extra_tags: list[str], limit: int) -> list[ScrapedArticle]:
    """Extract post text + metadata from an already-loaded Facebook page."""
    articles: list[ScrapedArticle] = []

    # Scroll to load more posts
    for _ in range(min(limit // 5, 6)):
        await page.evaluate("window.scrollBy(0, window.innerHeight * 2)")
        await _human_delay(1.0, 2.0)

    post_elements = await page.query_selector_all('[role="article"]')
    logger.debug("Found %d article elements on %s", len(post_elements), source_label)

    for el in post_elements[:limit]:
        try:
            # Extract text — try selectors in order
            text = ""
            for sel in POST_TEXT_SELECTORS:
                try:
                    text_el = await el.query_selector(sel)
                    if text_el:
                        text = (await text_el.inner_text()).strip()
                        if text:
                            break
                except Exception:
                    continue

            if not text or len(text) < 15:
                continue

            # Try to extract post URL from timestamp link
            url = ""
            try:
                time_link = await el.query_selector("a[role='link'] time, a[href*='/posts/'], a[href*='/permalink/']")
                if time_link:
                    tag = await time_link.get_attribute("href") or ""
                    if tag.startswith("/"):
                        tag = f"https://www.facebook.com{tag}"
                    url = tag.split("?")[0]  # strip tracking params
            except Exception:
                pass

            if not url:
                url = page.url.split("?")[0]

            # Try to extract timestamp from <time datetime="...">
            published_at = datetime.now(timezone.utc)
            try:
                time_el = await el.query_selector("time[datetime]")
                if time_el:
                    dt_str = await time_el.get_attribute("datetime")
                    if dt_str:
                        published_at = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            except Exception:
                pass

            title = text[:120].strip()
            if len(text) > 120:
                title += "…"

            articles.append(ScrapedArticle(
                url=url,
                title=title,
                content=text[:3000],
                published_at=published_at,
                source=f"facebook:{source_label}",
                tags=["facebook", "social"] + extra_tags,
            ))

        except Exception as exc:
            logger.debug("Failed to extract post: %s", exc)
            continue

    return articles


class FacebookPageScraper(BaseScraper):
    """Scrape recent posts from a list of public Facebook page URLs using Playwright.

    No login required for public pages. If a login wall appears the page is skipped
    gracefully so the rest of the run continues.
    """

    source_name = "facebook_page"

    def __init__(self, page_urls: list[str] | None = None, headless: bool = True) -> None:
        super().__init__()
        self._page_urls = page_urls or DEFAULT_PAGE_URLS
        self._headless = headless

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.error("playwright not installed — run: pip install playwright && playwright install chromium")
            return []

        articles: list[ScrapedArticle] = []
        per_page = max(limit // len(self._page_urls), 5)

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=self._headless)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                locale="en-KE",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
            )

            for page_url in self._page_urls:
                page = await context.new_page()
                try:
                    slug = page_url.rstrip("/").split("/")[-1]
                    await page.goto(page_url, wait_until="domcontentloaded", timeout=20000)
                    await _human_delay(1.5, 3.0)
                    await _dismiss_popups(page)

                    # Detect login wall — if login form is visible, skip this page
                    login_wall = page.locator('form[action*="login"]')
                    if await login_wall.count() > 0:
                        logger.warning("Login wall on %s — skipping (set FB_EMAIL/FB_PASSWORD for full access)", page_url)
                        await page.close()
                        continue

                    posts = await _extract_posts_from_page(page, slug, [], per_page)
                    articles.extend(posts)
                    logger.info("FacebookPageScraper: %d posts from %s", len(posts), slug)

                except Exception as exc:
                    logger.warning("Failed to scrape page %s: %s", page_url, exc)
                finally:
                    await page.close()
                    await _human_delay(1.0, 2.5)

            await context.close()
            await browser.close()

        return articles


class FacebookForager(BaseScraper):
    """Search Facebook for political topics and citizen painpoints.

    Requires a Facebook account (FB_EMAIL + FB_PASSWORD). Searches using
    facebook.com/search/posts/?q=<query> and extracts matching posts.

    This is the key tool for discovering what real voters are saying about
    specific issues — ward politics, fuel prices, healthcare, etc.
    """

    source_name = "facebook_forager"

    def __init__(
        self,
        email: str,
        password: str,
        queries: list[tuple[str, str]] | None = None,
        headless: bool = True,
    ) -> None:
        super().__init__()
        self._email = email
        self._password = password
        self._queries = queries or ALL_FORAGER_QUERIES
        self._headless = headless

    async def fetch_recent(self, limit: int = 50) -> list[ScrapedArticle]:
        if not self._email or not self._password:
            logger.warning("FB_EMAIL or FB_PASSWORD not set — skipping FacebookForager")
            return []

        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.error("playwright not installed — run: pip install playwright && playwright install chromium")
            return []

        articles: list[ScrapedArticle] = []
        per_query = max(limit // len(self._queries), 3)

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=self._headless)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                locale="en-KE",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
            )

            # Login once, reuse context for all queries
            if not await self._login(context):
                await browser.close()
                return []

            for query, category in self._queries:
                page = await context.new_page()
                try:
                    search_url = f"https://www.facebook.com/search/posts/?q={query.replace(' ', '%20')}"
                    await page.goto(search_url, wait_until="domcontentloaded", timeout=20000)
                    await _human_delay(2.0, 4.0)
                    await _dismiss_popups(page)

                    posts = await _extract_posts_from_page(
                        page,
                        f"search:{category}",
                        [category, "forager"],
                        per_query,
                    )
                    # Tag each post with the search query for traceability
                    for post in posts:
                        post.tags.append(f"query:{query[:40]}")

                    articles.extend(posts)
                    logger.info("FacebookForager: %d posts for query '%s'", len(posts), query)

                except Exception as exc:
                    logger.warning("Forager query '%s' failed: %s", query, exc)
                finally:
                    await page.close()
                    await _human_delay(3.0, 6.0)  # longer delay between searches

            await context.close()
            await browser.close()

        return articles

    async def _login(self, context) -> bool:
        """Log in to Facebook. Returns True on success."""
        page = await context.new_page()
        try:
            await page.goto("https://www.facebook.com/login", wait_until="domcontentloaded", timeout=20000)
            await _human_delay(1.0, 2.0)

            await page.fill('input[name="email"]', self._email)
            await _human_delay(0.3, 0.7)
            await page.fill('input[name="pass"]', self._password)
            await _human_delay(0.3, 0.7)
            await page.click('button[name="login"]')
            await page.wait_for_load_state("domcontentloaded", timeout=15000)
            await _human_delay(2.0, 3.5)

            # Check for 2FA / checkpoint page
            if "checkpoint" in page.url or "two_step" in page.url:
                logger.error(
                    "Facebook login hit 2FA checkpoint — cannot proceed automatically. "
                    "Use an account without 2FA or pre-generate a session cookie."
                )
                return False

            # Check for CAPTCHA
            captcha = page.locator('[id="captcha"]')
            if await captcha.count() > 0:
                logger.error("Facebook login blocked by CAPTCHA — try a different account or add delays.")
                return False

            # Verify we're logged in by checking for the home feed
            if "login" in page.url or "error" in page.url:
                logger.error("Facebook login failed — check FB_EMAIL / FB_PASSWORD.")
                return False

            logger.info("FacebookForager: logged in successfully")
            return True

        except Exception as exc:
            logger.error("Facebook login error: %s", exc)
            return False
        finally:
            await page.close()
