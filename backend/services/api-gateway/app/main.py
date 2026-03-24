from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, candidates, sentiment, opponent, briefing, health, intake

app = FastAPI(
    title="Kampeni API Gateway",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
