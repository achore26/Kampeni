from __future__ import annotations

from collections.abc import AsyncGenerator, Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

settings = get_settings()


# ─── Base ─────────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ─── Async engine (FastAPI endpoints) ────────────────────────────────────────
engine = create_async_engine(
    settings.postgres_dsn,
    echo=settings.app_env == "development",
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


# ─── Sync engine (Celery tasks + create_all) ─────────────────────────────────
sync_engine = create_engine(
    settings.postgres_dsn_sync,
    echo=settings.app_env == "development",
    pool_pre_ping=True,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


def get_sync_db() -> Generator[Session, None, None]:
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()
