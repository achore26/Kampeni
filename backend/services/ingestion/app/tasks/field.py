"""Field agent report intake.

This is push-based (agents submit TO us), not pull-based.
MVP: simple HTTP intake API + structured WhatsApp form.
Phase 2: full offline-capable mobile app.
"""
from ..worker import celery_app


@celery_app.task
def process_field_report(report_data: dict) -> None:
    # TODO: classify report, extract sentiment signal, route to sentiment service
    pass
