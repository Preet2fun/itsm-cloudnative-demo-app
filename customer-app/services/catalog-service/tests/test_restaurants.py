from __future__ import annotations

import json
import uuid
from unittest.mock import AsyncMock

from app import router as router_module

TENANT_HEADERS = {"X-Tenant-ID": "customer_a"}


def test_list_restaurants_missing_tenant_header_returns_422(client):
    response = client.get("/api/v1/restaurants")
    assert response.status_code == 422


def test_list_restaurants_invalid_tenant_header_returns_400(client):
    response = client.get("/api/v1/restaurants", headers={"X-Tenant-ID": "Bad-Tenant!"})
    assert response.status_code == 400


def test_list_restaurants_empty(client, fake_repo):
    response = client.get("/api/v1/restaurants", headers=TENANT_HEADERS)
    assert response.status_code == 200
    assert response.json() == {"restaurants": [], "total": 0, "limit": 20, "offset": 0}


def test_list_restaurants_returns_seeded_data(client, fake_repo):
    fake_repo.seed_restaurant(name="Sushi Place", cuisine="japanese")
    response = client.get("/api/v1/restaurants", headers=TENANT_HEADERS)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["restaurants"][0]["name"] == "Sushi Place"


def test_list_restaurants_returns_cached_payload_without_hitting_repository(
    client, fake_repo, monkeypatch
):
    cached_payload = json.dumps({"restaurants": [], "total": 5, "limit": 20, "offset": 0})
    monkeypatch.setattr(router_module.cache, "cache_get", AsyncMock(return_value=cached_payload))

    def _fail_if_called(*args, **kwargs):
        raise AssertionError("repository.list_restaurants should not be called on a cache hit")

    monkeypatch.setattr(router_module.repository, "list_restaurants", _fail_if_called)

    response = client.get("/api/v1/restaurants", headers=TENANT_HEADERS)
    assert response.status_code == 200
    assert response.json()["total"] == 5


def test_create_restaurant(client, fake_repo):
    response = client.post(
        "/api/v1/restaurants",
        headers=TENANT_HEADERS,
        json={"name": "Taco Stand", "cuisine": "mexican"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Taco Stand"
    assert body["cuisine"] == "mexican"
    assert body["is_active"] is True
    assert uuid.UUID(body["id"])


def test_create_restaurant_invalidates_cache(client, fake_repo, _stub_infra):
    client.post("/api/v1/restaurants", headers=TENANT_HEADERS, json={"name": "Taco Stand"})
    _stub_infra["cache_invalidate"].assert_awaited_once_with("customer_a", "restaurants")


def test_get_restaurant_found(client, fake_repo):
    seeded = fake_repo.seed_restaurant(name="Noodle Bar")
    response = client.get(f"/api/v1/restaurants/{seeded['id']}", headers=TENANT_HEADERS)
    assert response.status_code == 200
    assert response.json()["name"] == "Noodle Bar"


def test_get_restaurant_not_found(client, fake_repo):
    response = client.get(f"/api/v1/restaurants/{uuid.uuid4()}", headers=TENANT_HEADERS)
    assert response.status_code == 404
