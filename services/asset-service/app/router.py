from __future__ import annotations

import json
import time
import uuid

from fastapi import APIRouter, Header, HTTPException, Query
from opentelemetry.trace import StatusCode

from app import cache, repository
from app.db import tenant_session
from app.models import AssetCreate, AssetListResponse, AssetResponse, AssetUpdate, IncidentSummaryResponse
from app.telemetry import get_meter, get_tracer

router = APIRouter(prefix="/api/v1")

# ── OTel instruments ───────────────────────────────────────────────────────────
_tracer = get_tracer()
_meter = get_meter()

_assets_created = _meter.create_counter("itsm_assets_created_total", description="Assets created")
_status_changes = _meter.create_counter("itsm_asset_status_changes_total", description="Asset status changes")
_active_gauge = _meter.create_up_down_counter("itsm_assets_active_total", description="Active assets by type")
_cache_duration = _meter.create_histogram("itsm_asset_cache_duration_seconds", unit="s", description="Cache lookup duration")


def _tenant(x_tenant_id: str = Header(..., alias="X-Tenant-ID")) -> str:
    import re
    if not re.match(r"^[a-z][a-z0-9_]{0,62}$", x_tenant_id):
        raise HTTPException(status_code=400, detail="X-Tenant-ID contains invalid characters")
    return x_tenant_id


# ── Health ─────────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "service": "asset-service"}


# ── Assets ─────────────────────────────────────────────────────────────────────

@router.get("/assets", response_model=AssetListResponse)
async def list_assets(
    asset_type: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    params = {"asset_type": asset_type, "status": status, "limit": limit, "offset": offset}

    with _tracer.start_as_current_span("itsm.asset.cache_lookup") as span:
        span.set_attribute("tenant.id", tenant_id)
        span.set_attribute("filter_key", json.dumps({k: v for k, v in params.items() if v is not None}))
        t0 = time.perf_counter()
        cached = await cache.cache_get(tenant_id, "assets", "list", params)
        hit = cached is not None
        duration = time.perf_counter() - t0
        span.set_attribute("cache.hit", hit)
        _cache_duration.record(duration, {"tenant_id": tenant_id, "cache_hit": str(hit).lower()})

    if cached:
        data = json.loads(cached)
        return AssetListResponse(**data)

    async with tenant_session(tenant_id) as session:
        assets, total = await repository.list_assets(session, asset_type, status, limit, offset)

    result = AssetListResponse(
        assets=[AssetResponse(**a) for a in assets],
        total=total,
        limit=limit,
        offset=offset,
    )
    await cache.cache_set(tenant_id, "assets", "list", params, result.model_dump_json(), ttl=60)
    return result


@router.post("/assets", response_model=AssetResponse, status_code=201)
async def create_asset(
    body: AssetCreate,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        asset = await repository.create_asset(session, body)

    await cache.cache_invalidate(tenant_id, "assets")

    _assets_created.add(1, {"tenant_id": tenant_id, "asset_type": body.asset_type})
    if body.status == "active":
        _active_gauge.add(1, {"tenant_id": tenant_id, "asset_type": body.asset_type})

    return AssetResponse(**asset)


@router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        asset = await repository.get_asset(session, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse(**asset)


@router.put("/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: uuid.UUID,
    body: AssetUpdate,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        result = await repository.update_asset(session, asset_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Asset not found")

    asset, old_status = result
    await cache.cache_invalidate(tenant_id, "assets")

    if body.status and body.status != old_status:
        with _tracer.start_as_current_span("itsm.asset.status_change") as span:
            span.set_attribute("asset.id", str(asset_id))
            span.set_attribute("asset.type", asset.get("asset_type", ""))
            span.set_attribute("old_status", old_status)
            span.set_attribute("new_status", body.status)
            span.set_attribute("tenant.id", tenant_id)
            if body.status == "retired":
                span.add_event("asset.retired")

        _status_changes.add(1, {
            "tenant_id": tenant_id,
            "from_status": old_status,
            "to_status": body.status,
        })
        if old_status == "active":
            _active_gauge.add(-1, {"tenant_id": tenant_id, "asset_type": asset.get("asset_type", "")})
        if body.status == "active":
            _active_gauge.add(1, {"tenant_id": tenant_id, "asset_type": asset.get("asset_type", "")})

    return AssetResponse(**asset)


@router.delete("/assets/{asset_id}", status_code=204)
async def delete_asset(
    asset_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        deleted = await repository.delete_asset(session, asset_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Asset not found")
    await cache.cache_invalidate(tenant_id, "assets")


@router.get("/assets/{asset_id}/incidents", response_model=list[IncidentSummaryResponse])
async def get_asset_incidents(
    asset_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        incidents = await repository.get_asset_incidents(session, asset_id)
    return [IncidentSummaryResponse(**i) for i in incidents]
