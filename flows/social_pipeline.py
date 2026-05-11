"""Social Media Pipeline Flow — runs every 60 minutes.

Orchestrates Facebook scraping:
  Step 1: Trigger FacebookPageScraper (public pages, no login)
  Step 2: Trigger FacebookForager (keyword search — political topics + painpoints)

Services run synchronously — each HTTP call blocks until the batch is done.
Forager requires FB_EMAIL to be configured; if not set, it no-ops gracefully.
"""
import os

import requests
from prefect import flow, task, get_run_logger

INGESTION_URL = os.getenv("INGESTION_SERVICE_URL", "http://ingestion:8004")
TRANSLATION_URL = os.getenv("TRANSLATION_SERVICE_URL", "http://translation:8005")
_SECRET = os.getenv("INTERNAL_TRIGGER_SECRET", "")
_HEADERS = {"X-Internal-Secret": _SECRET}


@task(retries=2, retry_delay_seconds=30)
def trigger_social_ingestion() -> dict:
    """POST to the ingestion service to run Facebook scraping synchronously."""
    logger = get_run_logger()
    # Playwright scraping can take a while — generous timeout
    response = requests.post(f"{INGESTION_URL}/trigger/social", headers=_HEADERS, timeout=900)
    response.raise_for_status()
    data = response.json()
    logger.info("Social ingestion done: %s", data)
    return data


@task(retries=2, retry_delay_seconds=15)
def trigger_translation() -> dict:
    """Flush any social posts that need translation."""
    logger = get_run_logger()
    response = requests.post(f"{TRANSLATION_URL}/trigger/translate", headers=_HEADERS, timeout=300)
    response.raise_for_status()
    data = response.json()
    logger.info("Translation done: %s", data)
    return data


@flow(name="social-pipeline", log_prints=True)
def social_pipeline() -> None:
    """Facebook page scraping + keyword forager pipeline.

    Runs every 60 minutes. Trigger manually from Prefect UI at http://localhost:4200.
    """
    trigger_social_ingestion()
    trigger_translation()
