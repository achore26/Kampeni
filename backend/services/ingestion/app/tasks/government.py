from ..worker import celery_app


@celery_app.task
def ingest_hansard() -> None:
    # TODO: scrape Parliament website, parse PDFs, index into PostgreSQL + Qdrant
    pass
