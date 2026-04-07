"""Daily Briefing Flow — runs twice a day at 5am and 6am EAT.

The daily briefing is the flagship feature — the candidate wakes up
to a one-page AI summary of everything overnight.

Two-step pipeline:
  5am EAT → generate briefings (AI writes the brief, Political Director reviews)
  6am EAT → deliver approved briefings (push notification + email + SMS fallback)

The 1-hour gap between generate and deliver gives the Political Director
time to approve before it hits the candidate's phone.

EAT = East Africa Time = UTC+3
  5am EAT = 2am UTC  → cron: "0 2 * * *"
  6am EAT = 3am UTC  → cron: "0 3 * * *"
"""
import os

import requests
from prefect import flow, task, get_run_logger

BRIEFING_URL = os.getenv("BRIEFING_SERVICE_URL", "http://briefing:8003")


@task(retries=2, retry_delay_seconds=60)
def trigger_briefing_generation() -> str:
    """Tell the briefing service to generate AI briefs for all active candidates."""
    logger = get_run_logger()
    response = requests.post(f"{BRIEFING_URL}/trigger/generate", timeout=15)
    response.raise_for_status()
    data = response.json()
    logger.info("Briefing generation queued — Celery task ID: %s", data["task_id"])
    return data["task_id"]


@task(retries=2, retry_delay_seconds=60)
def trigger_briefing_delivery() -> str:
    """Tell the briefing service to deliver approved briefings to candidates."""
    logger = get_run_logger()
    response = requests.post(f"{BRIEFING_URL}/trigger/deliver", timeout=15)
    response.raise_for_status()
    data = response.json()
    logger.info("Briefing delivery queued — Celery task ID: %s", data["task_id"])
    return data["task_id"]


@flow(name="daily-briefing-generate", log_prints=True)
def daily_briefing_generate() -> None:
    """Generate daily AI briefings at 5am EAT. Political Director reviews before delivery."""
    trigger_briefing_generation()


@flow(name="daily-briefing-deliver", log_prints=True)
def daily_briefing_deliver() -> None:
    """Deliver approved briefings to candidates at 6am EAT."""
    trigger_briefing_delivery()
