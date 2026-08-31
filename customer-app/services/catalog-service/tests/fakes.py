from __future__ import annotations

import uuid
from datetime import datetime, timezone


class InMemoryCatalogRepository:
    """Stands in for app.repository so router tests don't need a real Postgres."""

    def __init__(self) -> None:
        self.restaurants: dict[uuid.UUID, dict] = {}
        self.menu_items: dict[uuid.UUID, dict] = {}

    def seed_restaurant(self, **overrides) -> dict:
        restaurant = {
            "id": uuid.uuid4(),
            "name": "Test Restaurant",
            "cuisine": "italian",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
        }
        restaurant.update(overrides)
        self.restaurants[restaurant["id"]] = restaurant
        return restaurant

    def seed_menu_item(self, restaurant_id: uuid.UUID, **overrides) -> dict:
        item = {
            "id": uuid.uuid4(),
            "restaurant_id": restaurant_id,
            "name": "Test Item",
            "price": 9.99,
            "is_available": True,
            "created_at": datetime.now(timezone.utc),
        }
        item.update(overrides)
        self.menu_items[item["id"]] = item
        return item

    async def list_restaurants(self, session, limit: int, offset: int):
        items = sorted(self.restaurants.values(), key=lambda r: r["created_at"], reverse=True)
        page = items[offset : offset + limit]
        return page, len(items)

    async def get_restaurant(self, session, restaurant_id: uuid.UUID):
        return self.restaurants.get(restaurant_id)

    async def create_restaurant(self, session, data):
        restaurant = {
            "id": uuid.uuid4(),
            "name": data.name,
            "cuisine": data.cuisine,
            "is_active": data.is_active,
            "created_at": datetime.now(timezone.utc),
        }
        self.restaurants[restaurant["id"]] = restaurant
        return restaurant

    async def list_menu_items(self, session, restaurant_id: uuid.UUID):
        items = [i for i in self.menu_items.values() if i["restaurant_id"] == restaurant_id]
        return sorted(items, key=lambda i: i["created_at"], reverse=True)

    async def create_menu_item(self, session, restaurant_id: uuid.UUID, data):
        item = {
            "id": uuid.uuid4(),
            "restaurant_id": restaurant_id,
            "name": data.name,
            "price": data.price,
            "is_available": data.is_available,
            "created_at": datetime.now(timezone.utc),
        }
        self.menu_items[item["id"]] = item
        return item
