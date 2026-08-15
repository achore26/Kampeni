import asyncio
import sys
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

# Make sure shared/ is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.database import Base
import shared.models  # noqa: F401 — register all mappers with Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _get_url() -> str:
    # Prefer env vars so the correct host is used inside Docker
    host = os.environ.get("POSTGRES_HOST", "localhost")
    port = os.environ.get("POSTGRES_PORT", "5432")
    user = os.environ.get("POSTGRES_USER", "kampeni")
    password = os.environ.get("POSTGRES_PASSWORD", "kampeni_dev")
    db = os.environ.get("POSTGRES_DB", "kampeni")
    if any(os.environ.get(k) for k in ("POSTGRES_HOST", "POSTGRES_USER", "POSTGRES_PASSWORD")):
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"
    return config.get_main_option("sqlalchemy.url")


def run_migrations_offline() -> None:
    url = _get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = create_async_engine(
        _get_url(),
    )
    async with connectable.connect() as connection:
        await connection.run_sync(
            lambda conn: context.configure(
                conn,
                target_metadata=target_metadata,
                compare_type=True,
            )
        )
        async with connection.begin():
            await connection.run_sync(lambda _: context.run_migrations())

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
