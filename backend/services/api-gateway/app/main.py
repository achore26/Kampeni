import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, candidates, sentiment, opponent, briefing, health, intake, painpoints

_app_env = os.getenv("APP_ENV", "development")
_cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:3000")

app = FastAPI(
    title="Kampeni API Gateway",
    version="0.1.0",
    docs_url="/docs" if _app_env != "production" else None,
    redoc_url="/redoc" if _app_env != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[_cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["candidates"])
app.include_router(sentiment.router, prefix="/api/v1/sentiment", tags=["sentiment"])
app.include_router(opponent.router, prefix="/api/v1/opponents", tags=["opponents"])
app.include_router(briefing.router, prefix="/api/v1/briefings", tags=["briefings"])
app.include_router(intake.router, prefix="/api/v1/intake", tags=["intake"])
app.include_router(painpoints.router, prefix="/api/v1/painpoints", tags=["painpoints"])
