from contextlib import asynccontextmanager

from fastapi import FastAPI

from shared.database import Base, sync_engine
from shared.models import Article, SentimentRecord  # noqa: F401 — register mappers

from .routers import health, sentiment, trigger


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, Base.metadata.create_all, sync_engine)
    yield


app = FastAPI(
    title="Kampeni Sentiment Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health.router, tags=["health"])
app.include_router(sentiment.router, prefix="/sentiment", tags=["sentiment"])
app.include_router(trigger.router)
