"""Painpoint Pipeline Flow — runs every 2 minutes.

Drains articles:painpoint:pending queue — extracts civic issues using Claude/GPT
and stores PainPoint records in Postgres.
"""
import os

import requests
from prefect import flow, task, get_run_logger

PAINPOINT_URL = os.getenv("PAINPOINT_SERVICE_URL", "http://painpoint:8006")
_SECRET = os.getenv("INTERNAL_TRIGGER_SECRET", "")
_HEADERS = {"X-Internal-Secret": _SECRET}


@task(retries=2, retry_delay_seconds=10)
def trigger_painpoint_extraction() -> dict:
    logger = get_run_logger()
    response = requests.post(f"{PAINPOINT_URL}/trigger/painpoints", headers=_HEADERS, timeout=300)
    response.raise_for_status()
    data = response.json()
    logger.info("Painpoint extraction done: %s", data)
    return data


@flow(name="painpoint-pipeline", log_prints=True)
def painpoint_pipeline() -> None:
    trigger_painpoint_extraction()
