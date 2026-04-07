"""News Pipeline Flow — runs every 30 minutes.

This flow orchestrates the full news → sentiment pipeline:
  Step 1: Tell the ingestion service to scrape news (Nation, Standard, Citizen)
  Step 2: Wait 3 minutes for Celery to finish scraping + storing in Postgres/MinIO
  Step 3: Tell the sentiment service to classify all new articles

Why two separate steps?
  Ingestion is slow (HTTP scraping). We give it time to finish before
  asking sentiment to classify. In Month 3 we'll add proper polling
  to check Celery task status instead of a fixed wait.
"""
import os
import time

import requests
from prefect import flow, task, get_run_logger
from prefect.schedules import CronSchedule

INGESTION_URL = os.getenv("INGESTION_SERVICE_URL", "http://ingestion:8004")
SENTIMENT_URL = os.getenv("SENTIMENT_SERVICE_URL", "http://sentiment:8001")


@task(retries=3, retry_delay_seconds=30)
def trigger_news_ingestion() -> str:
    """POST to the ingestion service to start scraping. Returns the Celery task ID."""
    logger = get_run_logger()
    response = requests.post(f"{INGESTION_URL}/trigger/news", timeout=10)
    response.raise_for_status()
    data = response.json()
    logger.info("News ingestion queued — Celery task ID: %s", data["task_id"])
    return data["task_id"]


@task
def wait_for_ingestion(seconds: int = 180) -> None:
    """Give the Celery worker time to scrape and store articles.

    180 seconds (3 min) is generous for scraping 3 RSS feeds + storing to
    Postgres and MinIO. We'll replace this with real status polling in Month 3.
    """
    logger = get_run_logger()
    logger.info("Waiting %ds for ingestion to complete...", seconds)
    time.sleep(seconds)


@task(retries=3, retry_delay_seconds=30)
def trigger_sentiment_classification() -> str:
    """POST to the sentiment service to classify all pending articles."""
    logger = get_run_logger()
    response = requests.post(f"{SENTIMENT_URL}/trigger/sentiment", timeout=10)
    response.raise_for_status()
    data = response.json()
    logger.info("Sentiment classification queued — Celery task ID: %s", data["task_id"])
    return data["task_id"]


@flow(name="news-pipeline", log_prints=True)
def news_pipeline() -> None:
    """Full news ingestion → sentiment classification pipeline.

    Runs every 30 minutes. You can also trigger it manually from the
    Prefect UI at http://localhost:4200.
    """
    task_id = trigger_news_ingestion()
    wait_for_ingestion(seconds=180)
    trigger_sentiment_classification()
