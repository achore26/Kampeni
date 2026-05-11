"""Pain point extraction service — FastAPI app."""
from fastapi import FastAPI

from .routers import health, painpoints
from .routers.trigger import router as trigger_router

app = FastAPI(title="Kampeni Pain Point Service", version="1.0.0")

app.include_router(health.router)
app.include_router(painpoints.router)
app.include_router(trigger_router)


@app.get("/")
async def root() -> dict:
    return {"service": "painpoint", "status": "ok"}
