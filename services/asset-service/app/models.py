from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Date, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


# ── SQLAlchemy ORM ─────────────────────────────────────────────────────────────

class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    asset_type: Mapped[str] = mapped_column(String, nullable=False)
    serial_number: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    purchased_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    warranty_until: Mapped[date | None] = mapped_column(Date, nullable=True)
    # "metadata" is reserved in SQLAlchemy Base — map column name explicitly
    asset_metadata: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "asset_type": self.asset_type,
            "serial_number": self.serial_number,
            "status": self.status,
            "location": self.location,
            "assigned_to": self.assigned_to,
            "purchased_at": self.purchased_at,
            "warranty_until": self.warranty_until,
            "metadata": self.asset_metadata or {},
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class IncidentSummary(Base):
    """Read-only model used only for GET /assets/{id}/incidents."""
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    title: Mapped[str] = mapped_column(String)
    priority: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)
    related_asset: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


# ── Pydantic request / response schemas ───────────────────────────────────────

class AssetCreate(BaseModel):
    name: str
    asset_type: str
    serial_number: str | None = None
    status: str = "active"
    location: str | None = None
    assigned_to: uuid.UUID | None = None
    purchased_at: date | None = None
    warranty_until: date | None = None
    metadata: dict[str, Any] = {}


class AssetUpdate(BaseModel):
    name: str | None = None
    asset_type: str | None = None
    serial_number: str | None = None
    status: str | None = None
    location: str | None = None
    assigned_to: uuid.UUID | None = None
    purchased_at: date | None = None
    warranty_until: date | None = None
    metadata: dict[str, Any] | None = None


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=False)

    id: uuid.UUID
    name: str
    asset_type: str
    serial_number: str | None
    status: str
    location: str | None
    assigned_to: uuid.UUID | None
    purchased_at: date | None
    warranty_until: date | None
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class AssetListResponse(BaseModel):
    assets: list[AssetResponse]
    total: int
    limit: int
    offset: int


class IncidentSummaryResponse(BaseModel):
    id: uuid.UUID
    title: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
