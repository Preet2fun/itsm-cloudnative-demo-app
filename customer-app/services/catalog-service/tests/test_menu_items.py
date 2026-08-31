from __future__ import annotations

TENANT_HEADERS = {"X-Tenant-ID": "customer_a"}


def test_list_menu_items_empty(client, fake_repo):
    restaurant = fake_repo.seed_restaurant()
    response = client.get(
        f"/api/v1/restaurants/{restaurant['id']}/menu-items", headers=TENANT_HEADERS
    )
    assert response.status_code == 200
    assert response.json() == []


def test_list_menu_items_returns_seeded_items(client, fake_repo):
    restaurant = fake_repo.seed_restaurant()
    fake_repo.seed_menu_item(restaurant["id"], name="Margherita", price=12.5)
    response = client.get(
        f"/api/v1/restaurants/{restaurant['id']}/menu-items", headers=TENANT_HEADERS
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["name"] == "Margherita"
    assert body[0]["price"] == 12.5


def test_create_menu_item(client, fake_repo):
    restaurant = fake_repo.seed_restaurant()
    response = client.post(
        f"/api/v1/restaurants/{restaurant['id']}/menu-items",
        headers=TENANT_HEADERS,
        json={"name": "Coke", "price": 2.5},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Coke"
    assert body["price"] == 2.5
    assert body["restaurant_id"] == str(restaurant["id"])


def test_create_menu_item_missing_tenant_header_returns_422(client, fake_repo):
    restaurant = fake_repo.seed_restaurant()
    response = client.post(
        f"/api/v1/restaurants/{restaurant['id']}/menu-items",
        json={"name": "Coke", "price": 2.5},
    )
    assert response.status_code == 422


def test_list_menu_items_invalid_restaurant_id_returns_422(client, fake_repo):
    response = client.get(
        "/api/v1/restaurants/not-a-uuid/menu-items", headers=TENANT_HEADERS
    )
    assert response.status_code == 422
