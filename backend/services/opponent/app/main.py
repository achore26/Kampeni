from fastapi import FastAPI

from .routers import health, opponents, scrapers

app = FastAPI(title="Kampeni Opponent Tracker Service", version="0.1.0")

app.include_router(health.router, tags=["health"])
app.include_router(opponents.router, prefix="/opponents", tags=["opponents"])
app.include_router(scrapers.router, prefix="/scrapers", tags=["scrapers"])
