"""Ingestion service HTTP API — field agent intake endpoint."""
from fastapi import FastAPI

from .routers import health, intake, trigger

app = FastAPI(title="Kampeni Ingestion API", version="0.1.0")

app.include_router(health.router, tags=["health"])
app.include_router(intake.router, prefix="/intake", tags=["intake"])
app.include_router(trigger.router)
