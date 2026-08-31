from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models import MenuItemCreate, RestaurantCreate


def test_restaurant_create_defaults():
    restaurant = RestaurantCreate(name="Pizza Place")
    assert restaurant.cuisine is None
    assert restaurant.is_active is True


def test_restaurant_create_requires_name():
    with pytest.raises(ValidationError):
        RestaurantCreate()


def test_menu_item_create_defaults():
    item = MenuItemCreate(name="Burger", price=9.99)
    assert item.is_available is True


def test_menu_item_create_requires_price():
    with pytest.raises(ValidationError):
        MenuItemCreate(name="Burger")


def test_menu_item_create_rejects_non_numeric_price():
    with pytest.raises(ValidationError):
        MenuItemCreate(name="Burger", price="not-a-number")


def test_menu_item_create_rejects_zero_or_negative_price():
    with pytest.raises(ValidationError):
        MenuItemCreate(name="Burger", price=0)
    with pytest.raises(ValidationError):
        MenuItemCreate(name="Burger", price=-5.0)
