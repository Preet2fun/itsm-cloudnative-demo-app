from __future__ import annotations

import os
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock

# Must be set before app.config.Settings() is instantiated at import time
# (database_url / redis_url have no defaults). No real connection is ever
# opened in tests: startup handlers only run under `with TestClient(...)`,
# which these tests deliberately avoid.
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

# The setup_telemetry() monkeypatch below stops the app from calling into the
# OTel SDK on the path this test suite exercises, but FastAPIInstrumentor /
# the exporter classes imported at module scope still end up touching the
# real SDK internals — empirically, the patch alone still left BatchSpanProcessor/
# PeriodicExportingMetricReader background threads retrying against
# localhost:4317 and stalling the suite ~120s. OTEL_SDK_DISABLED is the
# standard OTel env var that makes the SDK a no-op at the source, which
# actually fixes it (verified: 37 passed in 0.05s vs 123s without this).
os.environ.setdefault("OTEL_SDK_DISABLED", "true")

import pytest
from fastapi.testclient import TestClient

import app.telemetry

# app.main.create_app() calls setup_telemetry() at import time, which spins up
# real BatchSpanProcessor / PeriodicExportingMetricReader background threads
# pointed at an OTLP endpoint that isn't running in tests. Those threads retry
# with growing backoff and stall `pytest` for minutes after tests finish, so
# the real implementation is swapped for a no-op before app.main is imported.
app.telemetry.setup_telemetry = lambda *args, **kwargs: None

from fakes import InMemoryCatalogRepository

from app import router as router_module
from app.main import app as fastapi_app


@pytest.fixture
def client() -> TestClient:
    return TestClient(fastapi_app)


@pytest.fixture(autouse=True)
def _stub_infra(monkeypatch):
    """Replace tenant_session/cache with fakes so no real Postgres/Redis is needed."""

    @asynccontextmanager
    async def fake_tenant_session(tenant_slug: str):
        yield None

    monkeypatch.setattr(router_module, "tenant_session", fake_tenant_session)

    mocks = {
        "cache_get": AsyncMock(return_value=None),
        "cache_set": AsyncMock(return_value=None),
        "cache_invalidate": AsyncMock(return_value=None),
    }
    for name, mock in mocks.items():
        monkeypatch.setattr(router_module.cache, name, mock)
    return mocks


@pytest.fixture
def fake_repo(monkeypatch) -> InMemoryCatalogRepository:
    repo = InMemoryCatalogRepository()
    monkeypatch.setattr(router_module.repository, "list_restaurants", repo.list_restaurants)
    monkeypatch.setattr(router_module.repository, "get_restaurant", repo.get_restaurant)
    monkeypatch.setattr(router_module.repository, "create_restaurant", repo.create_restaurant)
    monkeypatch.setattr(router_module.repository, "list_menu_items", repo.list_menu_items)
    monkeypatch.setattr(router_module.repository, "create_menu_item", repo.create_menu_item)
    return repo
