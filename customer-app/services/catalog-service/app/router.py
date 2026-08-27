from __future__ import annotations

import json
import re
import time
import uuid

from fastapi import APIRouter, Header, HTTPException, Query

from app import cache, repository
from app.db import tenant_session
from app.models import (
    MenuItemCreate,
    MenuItemResponse,
    RestaurantCreate,
    RestaurantListResponse,
    RestaurantResponse,
)
from app.telemetry import get_meter, get_tracer

router = APIRouter(prefix="/api/v1")

_tracer = get_tracer()
_meter = get_meter()

_restaurants_created = _meter.create_counter(
    "customer_restaurants_created_total", description="Restaurants created"
)
_menu_items_created = _meter.create_counter(
    "customer_menu_items_created_total", description="Menu items created"
)
_cache_duration = _meter.create_histogram(
    "customer_catalog_cache_duration_seconds", unit="s", description="Cache lookup duration"
)


def _tenant(x_tenant_id: str = Header(..., alias="X-Tenant-ID")) -> str:
    if not re.match(r"^[a-z][a-z0-9_]{0,62}$", x_tenant_id):
        raise HTTPException(status_code=400, detail="X-Tenant-ID contains invalid characters")
    return x_tenant_id


# ── Health ─────────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "service": "catalog-service"}


# ── Restaurants ────────────────────────────────────────────────────────────────

@router.get("/restaurants", response_model=RestaurantListResponse)
async def list_restaurants(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    params = {"limit": limit, "offset": offset}

    with _tracer.start_as_current_span("customer.catalog.cache_lookup") as span:
        span.set_attribute("tenant.id", tenant_id)
        t0 = time.perf_counter()
        cached = await cache.cache_get(tenant_id, "restaurants", "list", params)
        hit = cached is not None
        duration = time.perf_counter() - t0
        span.set_attribute("cache.hit", hit)
        _cache_duration.record(duration, {"tenant_id": tenant_id, "cache_hit": str(hit).lower()})

    if cached:
        return RestaurantListResponse(**json.loads(cached))

    with _tracer.start_as_current_span("customer.catalog.list_restaurants") as span:
        span.set_attribute("tenant.id", tenant_id)
        async with tenant_session(tenant_id) as session:
            restaurants, total = await repository.list_restaurants(session, limit, offset)
        span.set_attribute("result.count", len(restaurants))

    result = RestaurantListResponse(
        restaurants=[RestaurantResponse(**r) for r in restaurants],
        total=total,
        limit=limit,
        offset=offset,
    )
    await cache.cache_set(tenant_id, "restaurants", "list", params, result.model_dump_json(), ttl=60)
    return result


@router.post("/restaurants", response_model=RestaurantResponse, status_code=201)
async def create_restaurant(
    body: RestaurantCreate,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    with _tracer.start_as_current_span("customer.catalog.create_restaurant") as span:
        span.set_attribute("tenant.id", tenant_id)
        async with tenant_session(tenant_id) as session:
            restaurant = await repository.create_restaurant(session, body)
        span.set_attribute("restaurant.id", str(restaurant["id"]))

    await cache.cache_invalidate(tenant_id, "restaurants")
    _restaurants_created.add(1, {"tenant_id": tenant_id})
    return RestaurantResponse(**restaurant)


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        restaurant = await repository.get_restaurant(session, restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return RestaurantResponse(**restaurant)


# ── Menu items ─────────────────────────────────────────────────────────────────
# Not cached — mirrors asset-service, which doesn't cache its nested
# sub-resources (get_asset_incidents) either.

@router.get("/restaurants/{restaurant_id}/menu-items", response_model=list[MenuItemResponse])
async def list_menu_items(
    restaurant_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        items = await repository.list_menu_items(session, restaurant_id)
    return [MenuItemResponse(**i) for i in items]


@router.post(
    "/restaurants/{restaurant_id}/menu-items", response_model=MenuItemResponse, status_code=201
)
async def create_menu_item(
    restaurant_id: uuid.UUID,
    body: MenuItemCreate,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    with _tracer.start_as_current_span("customer.catalog.create_menu_item") as span:
        span.set_attribute("tenant.id", tenant_id)
        span.set_attribute("restaurant.id", str(restaurant_id))
        async with tenant_session(tenant_id) as session:
            item = await repository.create_menu_item(session, restaurant_id, body)

    _menu_items_created.add(1, {"tenant_id": tenant_id})
    return MenuItemResponse(**item)
