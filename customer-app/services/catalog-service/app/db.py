import logging
import re
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)

# Customer App tenant slugs follow the "customer_<name>" convention
# (e.g. customer_a) — distinct from Platform App's tenant_a/b/c.
_SAFE_SLUG = re.compile(r"^[a-z][a-z0-9_]{0,62}$")
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker | None = None


class Base(DeclarativeBase):
    pass


def _pg_async_url(url: str) -> str:
    url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # asyncpg doesn't accept sslmode — strip it (asyncpg uses ssl= connect_arg)
    url = re.sub(r"[?&]sslmode=[^&]*", "", url)
    return url


def init_db(database_url: str) -> None:
    global _engine, _session_factory
    _engine = create_async_engine(
        _pg_async_url(database_url),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    logger.info("Database engine initialised")


async def close_db() -> None:
    if _engine:
        await _engine.dispose()
        logger.info("Database engine disposed")


@asynccontextmanager
async def tenant_session(tenant_slug: str) -> AsyncGenerator[AsyncSession, None]:
    """Yield an AsyncSession with search_path set to the tenant schema."""
    if not _SAFE_SLUG.match(tenant_slug):
        raise ValueError(f"Invalid tenant slug: {tenant_slug!r}")
    async with _session_factory() as session:
        await session.execute(text(f"SET search_path TO {tenant_slug}, public"))
        yield session
