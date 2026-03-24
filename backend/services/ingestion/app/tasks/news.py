from ..worker import celery_app


@celery_app.task
def ingest_all_news() -> None:
    # TODO: run Nation, Standard, Citizen scrapers in parallel
    pass
