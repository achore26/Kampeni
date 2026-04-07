"""Translation service — FastAPI app."""
from fastapi import FastAPI

from .routers import health

app = FastAPI(title="Kampeni Translation Service", version="1.0.0")

app.include_router(health.router)


@app.get("/")
async def root() -> dict:
    return {"service": "translation", "status": "ok"}
