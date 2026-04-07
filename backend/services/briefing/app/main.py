from fastapi import FastAPI

from .routers import health, briefings, trigger

app = FastAPI(title="Kampeni Daily Briefing Service", version="0.1.0")

app.include_router(health.router, tags=["health"])
app.include_router(briefings.router, prefix="/briefings", tags=["briefings"])
app.include_router(trigger.router)
