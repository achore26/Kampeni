"""Field Reports Pipeline Flow — runs every 5 minutes.

Field agents submit reports via the mobile app → they land in Redis queue
→ this flow tells the ingestion service to flush that queue into Postgres.

Why 5 minutes?
  Field reports are time-sensitive. If an agent reports a hostile crowd
  at a rally, the campaign manager needs to see it fast.
"""
import os

import requests
from prefect import flow, task, get_run_logger

INGESTION_URL = os.getenv("INGESTION_SERVICE_URL", "http://ingestion:8004")


@task(retries=3, retry_delay_seconds=15)
def trigger_field_report_processing() -> str:
    """Tell the ingestion service to process pending field reports from Redis."""
    logger = get_run_logger()
    response = requests.post(f"{INGESTION_URL}/trigger/field-reports", timeout=10)
    response.raise_for_status()
    data = response.json()
    logger.info("Field report processing queued — Celery task ID: %s", data["task_id"])
    return data["task_id"]


@flow(name="field-reports-pipeline", log_prints=True)
def field_reports_pipeline() -> None:
    """Process pending field agent reports from Redis into Postgres.

    Runs every 5 minutes. Fast and lightweight — just pops from a Redis queue.
    """
    trigger_field_report_processing()
