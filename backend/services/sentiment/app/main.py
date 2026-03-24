from fastapi import FastAPI

from .routers import health, sentiment

app = FastAPI(title="Kampeni Sentiment Service", version="0.1.0")

app.include_router(health.router, tags=["health"])
app.include_router(sentiment.router, prefix="/sentiment", tags=["sentiment"])
