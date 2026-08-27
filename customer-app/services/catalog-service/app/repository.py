from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import MenuItem, MenuItemCreate, Restaurant, RestaurantCreate


async def list_restaurants(
    session: AsyncSession, limit: int, offset: int
) -> tuple[list[dict], int]:
    total = (await session.execute(select(func.count()).select_from(Restaurant))).scalar_one()
    rows = (
        await session.execute(
            select(Restaurant).order_by(Restaurant.created_at.desc()).limit(limit).offset(offset)
        )
    ).scalars().all()
    return [r.to_dict() for r in rows], total


async def get_restaurant(session: AsyncSession, restaurant_id: uuid.UUID) -> dict | None:
    row = (
        await session.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
    ).scalar_one_or_none()
    return row.to_dict() if row else None


async def create_restaurant(session: AsyncSession, data: RestaurantCreate) -> dict:
    restaurant = Restaurant(name=data.name, cuisine=data.cuisine, is_active=data.is_active)
    session.add(restaurant)
    await session.commit()
    await session.refresh(restaurant)
    return restaurant.to_dict()


async def list_menu_items(session: AsyncSession, restaurant_id: uuid.UUID) -> list[dict]:
    rows = (
        await session.execute(
            select(MenuItem)
            .where(MenuItem.restaurant_id == restaurant_id)
            .order_by(MenuItem.created_at.desc())
        )
    ).scalars().all()
    return [r.to_dict() for r in rows]


async def create_menu_item(
    session: AsyncSession, restaurant_id: uuid.UUID, data: MenuItemCreate
) -> dict:
    item = MenuItem(
        restaurant_id=restaurant_id,
        name=data.name,
        price=data.price,
        is_available=data.is_available,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item.to_dict()
