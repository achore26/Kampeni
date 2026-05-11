from contextlib import asynccontextmanager

from fastapi import FastAPI

from shared.database import Base, sync_engine
from shared.models import (  # noqa: F401 — register all mappers
    Article,
    OpponentMention,
    OpponentProfile,
    SentimentRecord,
)

from .routers import health, opponents, scrapers
from .routers.trigger import router as trigger_router


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, Base.metadata.create_all, sync_engine)
    yield


app = FastAPI(
    title="Kampeni Opponent Tracker Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health.router, tags=["health"])
app.include_router(opponents.router, prefix="/opponents", tags=["opponents"])
app.include_router(scrapers.router, prefix="/scrapers", tags=["scrapers"])
app.include_router(trigger_router)
