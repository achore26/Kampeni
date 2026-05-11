"""Opponent Pipeline Flow — runs every 10 minutes.

Scans recent articles for mentions of registered opponents and stores
OpponentMention records in Postgres.
"""
import os

import requests
from prefect import flow, task, get_run_logger

OPPONENT_URL = os.getenv("OPPONENT_SERVICE_URL", "http://opponent:8002")
_SECRET = os.getenv("INTERNAL_TRIGGER_SECRET", "")
_HEADERS = {"X-Internal-Secret": _SECRET}


@task(retries=2, retry_delay_seconds=15)
def trigger_opponent_scan() -> dict:
    logger = get_run_logger()
    response = requests.post(f"{OPPONENT_URL}/trigger/scan", headers=_HEADERS, timeout=120)
    response.raise_for_status()
    data = response.json()
    logger.info("Opponent scan done: %s", data)
    return data


@flow(name="opponent-pipeline", log_prints=True)
def opponent_pipeline() -> None:
    trigger_opponent_scan()
