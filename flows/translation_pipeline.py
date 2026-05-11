"""Translation Pipeline Flow — runs every 2 minutes.

Drains articles:translate:pending queue — translates non-EN/SW content
and pushes results to articles:painpoint:pending.
"""
import os

import requests
from prefect import flow, task, get_run_logger

TRANSLATION_URL = os.getenv("TRANSLATION_SERVICE_URL", "http://translation:8005")
_SECRET = os.getenv("INTERNAL_TRIGGER_SECRET", "")
_HEADERS = {"X-Internal-Secret": _SECRET}


@task(retries=2, retry_delay_seconds=10)
def trigger_translation() -> dict:
    logger = get_run_logger()
    response = requests.post(f"{TRANSLATION_URL}/trigger/translate", headers=_HEADERS, timeout=300)
    response.raise_for_status()
    data = response.json()
    logger.info("Translation done: %s", data)
    return data


@flow(name="translation-pipeline", log_prints=True)
def translation_pipeline() -> None:
    trigger_translation()
