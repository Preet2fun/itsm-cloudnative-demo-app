from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field
from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

# ── SQLAlchemy ORM ─────────────────────────────────────────────────────────────

class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    cuisine: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "cuisine": self.cuisine,
            "is_active": self.is_active,
            "created_at": self.created_at,
        }


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_available: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "restaurant_id": self.restaurant_id,
            "name": self.name,
            "price": self.price,
            "is_available": self.is_available,
            "created_at": self.created_at,
        }


# ── Pydantic request / response schemas ───────────────────────────────────────

class RestaurantCreate(BaseModel):
    name: str
    cuisine: str | None = None
    is_active: bool = True


class RestaurantResponse(BaseModel):
    id: uuid.UUID
    name: str
    cuisine: str | None
    is_active: bool
    created_at: datetime


class RestaurantListResponse(BaseModel):
    restaurants: list[RestaurantResponse]
    total: int
    limit: int
    offset: int


class MenuItemCreate(BaseModel):
    name: str
    price: float = Field(gt=0)
    is_available: bool = True


class MenuItemResponse(BaseModel):
    id: uuid.UUID
    restaurant_id: uuid.UUID
    name: str
    price: float
    is_available: bool
    created_at: datetime
