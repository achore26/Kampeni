"""Briefing tasks — called directly by the trigger router.

No Celery. Prefect orchestrates the briefing pipeline:
  flows/daily_briefing.py → POST /trigger/generate (5am EAT)
                          → POST /trigger/deliver  (6am EAT)

Political Director approval gate:
  Briefings are generated at 5am with is_approved=False.
  PD reviews via the dashboard and approves by 6am.
  Only approved briefings are delivered.
  If no briefing is approved by 6am, delivery is skipped (not a crash).
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from shared.models import Briefing
from .config import get_settings
from .engine.generator import BriefingGenerator

logger = logging.getLogger(__name__)

settings = get_settings()


def _get_db_session():
    engine = create_engine(settings.postgres_dsn_sync, pool_pre_ping=True)
    return sessionmaker(bind=engine)()


def generate_all_briefings() -> dict:
    """Generate daily briefings for all configured candidates."""
    candidate_ids = [c.strip() for c in settings.candidate_ids.split(",") if c.strip()]
    if not candidate_ids:
        logger.warning("No CANDIDATE_IDS configured — skipping briefing generation")
        return {"generated": 0}

    generator = BriefingGenerator()
    today = datetime.now(timezone.utc).date()
    generated = 0
    errors = 0

    db = _get_db_session()
    try:
        for candidate_id in candidate_ids:
            existing = (
                db.query(Briefing)
                .filter(
                    Briefing.candidate_id == candidate_id,
                    Briefing.briefing_date == today,
                )
                .first()
            )
            if existing:
                logger.info("Briefing already exists for candidate %s on %s — skipping", candidate_id, today)
                continue

            try:
                result = generator.generate(candidate_id, language=settings.briefing_language)
            except Exception as exc:
                logger.error("Briefing generation failed for candidate %s: %s", candidate_id, exc)
                errors += 1
                continue

            briefing = Briefing(
                candidate_id=candidate_id,
                briefing_date=result.briefing_date,
                language=result.language,
                sections=result.sections,
                raw_context=result.raw_context,
                is_approved=False,
                used_mock=result.used_mock,
            )
            db.add(briefing)
            db.commit()
            generated += 1
            logger.info(
                "Briefing generated for candidate %s (used_mock=%s, sections=%d)",
                candidate_id, result.used_mock, len(result.sections),
            )
    finally:
        db.close()

    return {"generated": generated, "errors": errors, "date": str(today)}


def deliver_approved_briefings() -> dict:
    """Deliver approved briefings to candidates via SMS (Africa's Talking)."""
    today = datetime.now(timezone.utc).date()
    delivered = skipped = errors = 0

    db = _get_db_session()
    try:
        approved = (
            db.query(Briefing)
            .filter(
                Briefing.briefing_date == today,
                Briefing.is_approved == True,  # noqa: E712
                Briefing.delivered_at.is_(None),
            )
            .all()
        )

        if not approved:
            logger.info("No approved briefings to deliver for %s", today)
            return {"delivered": 0, "skipped": 0}

        for briefing in approved:
            try:
                channels = _deliver_briefing(briefing)
                briefing.delivered_at = datetime.now(timezone.utc)
                briefing.delivery_channels = channels
                db.commit()
                delivered += 1
                logger.info(
                    "Delivered briefing %s to candidate %s via %s",
                    briefing.id, briefing.candidate_id, channels,
                )
            except Exception as exc:
                logger.error("Delivery failed for briefing %s: %s", briefing.id, exc)
                errors += 1
    finally:
        db.close()

    return {"delivered": delivered, "skipped": skipped, "errors": errors}


def _deliver_briefing(briefing: Briefing) -> list[str]:
    """Send briefing content via available channels. Returns list of successful channels."""
    channels: list[str] = []

    sections = briefing.sections or []
    sms_text = _format_sms(sections, briefing.briefing_date)

    if settings.at_api_key and settings.at_username:
        try:
            _send_sms(briefing.candidate_id, sms_text)
            channels.append("sms")
        except Exception as exc:
            logger.warning("SMS delivery failed for briefing %s: %s", briefing.id, exc)

    # TODO: FCM push notification (Month 5)
    # TODO: Email via SendGrid (Month 5)

    if not channels:
        logger.warning(
            "No delivery channels available for briefing %s. "
            "Set AT_API_KEY + AT_USERNAME in .env for SMS delivery.",
            briefing.id,
        )

    return channels


def _format_sms(sections: list[dict], briefing_date) -> str:
    """Condense briefing to fit SMS constraints (~300 chars for multi-part SMS)."""
    lines = [f"KAMPENI BRIEF — {briefing_date}"]
    for section in sections[:3]:
        title = section.get("title", "")
        content = section.get("content", "")
        lines.append(f"\n{title}:\n{content[:120]}")
    return "\n".join(lines)[:900]  # Africa's Talking handles splitting


def _send_sms(candidate_id: str, message: str) -> None:
    """Send SMS via Africa's Talking API."""
    import africastalking
    africastalking.initialize(settings.at_username, settings.at_api_key)
    sms = africastalking.SMS
    response = sms.send(message, [candidate_id], sender_id="KAMPENI")
    logger.debug("AT SMS response: %s", response)
