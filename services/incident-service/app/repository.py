from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    AssignRequest,
    EventCreate,
    Incident,
    IncidentCreate,
    IncidentEvent,
    IncidentUpdate,
    ResolveRequest,
    SLA_HOURS,
)


async def list_incidents(
    session: AsyncSession,
    priority: str | None,
    status: str | None,
    limit: int,
    offset: int,
) -> tuple[list[dict], int]:
    q = select(Incident)
    if priority:
        q = q.where(Incident.priority == priority)
    if status:
        q = q.where(Incident.status == status)

    total = (await session.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (
        await session.execute(q.order_by(Incident.created_at.desc()).limit(limit).offset(offset))
    ).scalars().all()
    return [r.to_dict() for r in rows], total


async def get_incident(session: AsyncSession, incident_id: uuid.UUID) -> dict | None:
    row = (await session.execute(select(Incident).where(Incident.id == incident_id))).scalar_one_or_none()
    return row.to_dict() if row else None


async def create_incident(session: AsyncSession, data: IncidentCreate) -> dict:
    now = datetime.now(timezone.utc)
    sla_hours = SLA_HOURS.get(data.priority, 24)
    incident = Incident(
        title=data.title,
        description=data.description,
        priority=data.priority,
        status="open",
        assigned_to=data.assigned_to,
        related_asset=data.related_asset,
        sla_breach_at=now + timedelta(hours=sla_hours),
    )
    session.add(incident)
    await session.commit()
    await session.refresh(incident)
    return incident.to_dict()


async def update_incident(
    session: AsyncSession, incident_id: uuid.UUID, data: IncidentUpdate
) -> tuple[dict, str, str] | None:
    row = (await session.execute(select(Incident).where(Incident.id == incident_id))).scalar_one_or_none()
    if not row:
        return None

    old_priority = row.priority
    old_status = row.status

    if data.title is not None:
        row.title = data.title
    if data.description is not None:
        row.description = data.description
    if data.priority is not None:
        row.priority = data.priority
    if data.status is not None:
        row.status = data.status
    if data.assigned_to is not None:
        row.assigned_to = data.assigned_to
    if data.related_asset is not None:
        row.related_asset = data.related_asset

    await session.commit()
    await session.refresh(row)
    return row.to_dict(), old_priority, old_status


async def delete_incident(session: AsyncSession, incident_id: uuid.UUID) -> bool:
    result = await session.execute(delete(Incident).where(Incident.id == incident_id))
    await session.commit()
    return result.rowcount > 0


async def assign_incident(session: AsyncSession, incident_id: uuid.UUID, data: AssignRequest) -> dict | None:
    row = (await session.execute(select(Incident).where(Incident.id == incident_id))).scalar_one_or_none()
    if not row:
        return None
    row.assigned_to = data.assigned_to
    row.status = "in_progress"
    await session.commit()
    await session.refresh(row)
    return row.to_dict()


async def resolve_incident(session: AsyncSession, incident_id: uuid.UUID) -> dict | None:
    row = (await session.execute(select(Incident).where(Incident.id == incident_id))).scalar_one_or_none()
    if not row:
        return None
    row.status = "resolved"
    row.resolved_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(row)
    return row.to_dict()


async def add_event(session: AsyncSession, incident_id: uuid.UUID, data: EventCreate) -> dict:
    event = IncidentEvent(
        incident_id=incident_id,
        actor_id=data.actor_id,
        event_type=data.event_type,
        payload=data.payload,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event.to_dict()


async def list_events(session: AsyncSession, incident_id: uuid.UUID) -> list[dict]:
    rows = (
        await session.execute(
            select(IncidentEvent)
            .where(IncidentEvent.incident_id == incident_id)
            .order_by(IncidentEvent.created_at.asc())
        )
    ).scalars().all()
    return [r.to_dict() for r in rows]
