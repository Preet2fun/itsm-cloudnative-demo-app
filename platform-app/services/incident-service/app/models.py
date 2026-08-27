from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

# SLA hours per priority (used to compute sla_breach_at on create)
SLA_HOURS: dict[str, int] = {"P1": 4, "P2": 8, "P3": 24, "P4": 72}


# ── SQLAlchemy ORM ─────────────────────────────────────────────────────────────

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False, default="")
    priority: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="open")
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    related_asset: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_breach_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "priority": self.priority,
            "status": self.status,
            "assigned_to": self.assigned_to,
            "related_asset": self.related_asset,
            "resolved_at": self.resolved_at,
            "sla_breach_at": self.sla_breach_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "actor_id": self.actor_id,
            "event_type": self.event_type,
            "payload": self.payload or {},
            "created_at": self.created_at,
        }


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    title: str
    description: str = ""
    priority: str
    related_asset: uuid.UUID | None = None
    assigned_to: uuid.UUID | None = None


class IncidentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    assigned_to: uuid.UUID | None = None
    related_asset: uuid.UUID | None = None


class AssignRequest(BaseModel):
    assigned_to: uuid.UUID


class ResolveRequest(BaseModel):
    resolution_notes: str = ""


class EventCreate(BaseModel):
    event_type: str
    payload: dict[str, Any] = {}
    actor_id: uuid.UUID | None = None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=False)

    id: uuid.UUID
    title: str
    description: str
    priority: str
    status: str
    assigned_to: uuid.UUID | None
    related_asset: uuid.UUID | None
    resolved_at: datetime | None
    sla_breach_at: datetime | None
    created_at: datetime
    updated_at: datetime


class IncidentListResponse(BaseModel):
    incidents: list[IncidentResponse]
    total: int
    limit: int
    offset: int


class IncidentEventResponse(BaseModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    actor_id: uuid.UUID | None
    event_type: str
    payload: dict[str, Any]
    created_at: datetime
