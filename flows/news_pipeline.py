"""News Pipeline Flow — runs every 30 minutes.

Orchestrates: ingestion → sentiment → translation (for non-EN/SW articles)

Services run synchronously — each HTTP call blocks until the batch is done.
Prefect gets the result directly from the response body.
"""
import os

import requests
from prefect import flow, task, get_run_logger

INGESTION_URL = os.getenv("INGESTION_SERVICE_URL", "http://ingestion:8004")
SENTIMENT_URL = os.getenv("SENTIMENT_SERVICE_URL", "http://sentiment:8001")
TRANSLATION_URL = os.getenv("TRANSLATION_SERVICE_URL", "http://translation:8005")
_SECRET = os.getenv("INTERNAL_TRIGGER_SECRET", "")
_HEADERS = {"X-Internal-Secret": _SECRET}


@task(retries=2, retry_delay_seconds=30)
def trigger_news_ingestion() -> dict:
    """POST to ingestion service — blocks until scraping + storage is done."""
    logger = get_run_logger()
    response = requests.post(f"{INGESTION_URL}/trigger/news", headers=_HEADERS, timeout=600)
    response.raise_for_status()
    data = response.json()
    logger.info("News ingestion done: %s", data)
    return data


@task(retries=2, retry_delay_seconds=15)
def trigger_sentiment_classification() -> dict:
    """POST to sentiment service — blocks until batch is classified."""
    logger = get_run_logger()
    response = requests.post(f"{SENTIMENT_URL}/trigger/sentiment", headers=_HEADERS, timeout=300)
    response.raise_for_status()
    data = response.json()
    logger.info("Sentiment done: %s", data)
    return data


@task(retries=2, retry_delay_seconds=15)
def trigger_translation() -> dict:
    """POST to translation service — processes non-EN/SW articles."""
    logger = get_run_logger()
    response = requests.post(f"{TRANSLATION_URL}/trigger/translate", headers=_HEADERS, timeout=300)
    response.raise_for_status()
    data = response.json()
    logger.info("Translation done: %s", data)
    return data


@flow(name="news-pipeline", log_prints=True)
def news_pipeline() -> None:
    """Full news ingestion → sentiment → translation pipeline.

    Runs every 30 minutes. Trigger manually from Prefect UI at http://localhost:4200.
    """
    ingest_result = trigger_news_ingestion()
    trigger_sentiment_classification()
    # Only run translation if new articles were saved
    if ingest_result.get("translation_queued", 0) > 0:
        trigger_translation()
