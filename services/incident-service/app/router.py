from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException, Query

from app import mq, repository
from app.db import tenant_session
from app.models import (
    AssignRequest,
    EventCreate,
    IncidentCreate,
    IncidentEventResponse,
    IncidentListResponse,
    IncidentResponse,
    IncidentUpdate,
    ResolveRequest,
    SLA_HOURS,
)
from app.telemetry import get_meter, get_tracer

router = APIRouter(prefix="/api/v1")

# ── OTel instruments ───────────────────────────────────────────────────────────
_tracer = get_tracer()
_meter = get_meter()

_created_counter = _meter.create_counter("itsm_incidents_created_total", description="Incidents created")
_resolved_counter = _meter.create_counter("itsm_incidents_resolved_total", description="Incidents resolved")
_sla_breached_counter = _meter.create_counter("itsm_incidents_sla_breached_total", description="SLA breaches detected")
_open_gauge = _meter.create_up_down_counter("itsm_incidents_open_total", description="Open incidents by priority")
_resolution_duration = _meter.create_histogram(
    "itsm_incident_resolution_duration_seconds", unit="s", description="Incident resolution duration"
)


def _tenant(x_tenant_id: str) -> str:
    if not re.match(r"^[a-z][a-z0-9_]{0,62}$", x_tenant_id):
        raise HTTPException(status_code=400, detail="X-Tenant-ID contains invalid characters")
    return x_tenant_id


# ── Health ─────────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "service": "incident-service"}


# ── Incidents ──────────────────────────────────────────────────────────────────

@router.get("/incidents", response_model=IncidentListResponse)
async def list_incidents(
    priority: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        incidents, total = await repository.list_incidents(session, priority, status, limit, offset)
    return IncidentListResponse(
        incidents=[IncidentResponse(**i) for i in incidents],
        total=total, limit=limit, offset=offset,
    )


@router.post("/incidents", response_model=IncidentResponse, status_code=201)
async def create_incident(
    body: IncidentCreate,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        incident = await repository.create_incident(session, body)

    with _tracer.start_as_current_span("itsm.incident.created") as span:
        span.set_attribute("incident.id", str(incident["id"]))
        span.set_attribute("incident.priority", incident["priority"])
        span.set_attribute("tenant.id", tenant_id)
        span.set_attribute("has_asset", incident["related_asset"] is not None)

        # SLA check
        with _tracer.start_as_current_span("itsm.incident.sla_check") as sla_span:
            now = datetime.now(timezone.utc)
            sla_at = incident.get("sla_breach_at")
            breached = sla_at is not None and now > sla_at
            age_minutes = 0
            sla_span.set_attribute("incident.id", str(incident["id"]))
            sla_span.set_attribute("priority", incident["priority"])
            sla_span.set_attribute("age_minutes", age_minutes)
            sla_span.set_attribute("sla_breached", breached)
            if breached:
                sla_span.add_event("incident.sla_breached")
                _sla_breached_counter.add(1, {"tenant_id": tenant_id, "priority": incident["priority"]})

    _created_counter.add(1, {"tenant_id": tenant_id, "priority": incident["priority"]})
    _open_gauge.add(1, {"tenant_id": tenant_id, "priority": incident["priority"]})

    # Publish to RabbitMQ
    with _tracer.start_as_current_span("itsm.incident.event_published") as pub_span:
        pub_span.set_attribute("event_type", "incident.created")
        pub_span.set_attribute("tenant.id", tenant_id)
        await mq.publish("incident.created", {
            "event": "incident.created",
            "tenant_id": tenant_id,
            "incident_id": str(incident["id"]),
            "priority": incident["priority"],
        })

    return IncidentResponse(**incident)


@router.get("/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        incident = await repository.get_incident(session, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse(**incident)


@router.put("/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: uuid.UUID,
    body: IncidentUpdate,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        result = await repository.update_incident(session, incident_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident, old_priority, old_status = result

    if body.priority and body.priority != old_priority:
        with _tracer.start_as_current_span("itsm.incident.priority_change") as span:
            span.set_attribute("incident.id", str(incident_id))
            span.set_attribute("old_priority", old_priority)
            span.set_attribute("new_priority", body.priority)
            span.set_attribute("tenant.id", tenant_id)

    with _tracer.start_as_current_span("itsm.incident.event_published") as span:
        span.set_attribute("event_type", "incident.updated")
        span.set_attribute("tenant.id", tenant_id)
        await mq.publish("incident.updated", {
            "event": "incident.updated",
            "tenant_id": tenant_id,
            "incident_id": str(incident_id),
        })

    return IncidentResponse(**incident)


@router.delete("/incidents/{incident_id}", status_code=204)
async def delete_incident(
    incident_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        deleted = await repository.delete_incident(session, incident_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Incident not found")


@router.post("/incidents/{incident_id}/assign", response_model=IncidentResponse)
async def assign_incident(
    incident_id: uuid.UUID,
    body: AssignRequest,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        incident = await repository.assign_incident(session, incident_id, body)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse(**incident)


@router.post("/incidents/{incident_id}/resolve", response_model=IncidentResponse)
async def resolve_incident(
    incident_id: uuid.UUID,
    body: ResolveRequest,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        incident_before = await repository.get_incident(session, incident_id)
        if not incident_before:
            raise HTTPException(status_code=404, detail="Incident not found")
        incident = await repository.resolve_incident(session, incident_id)

    with _tracer.start_as_current_span("itsm.incident.resolved") as span:
        created_at = incident_before["created_at"]
        resolved_at = incident["resolved_at"]
        duration_seconds = (resolved_at - created_at).total_seconds() if resolved_at else 0
        span.set_attribute("incident.id", str(incident_id))
        span.set_attribute("priority", incident["priority"])
        span.set_attribute("resolution_time_seconds", duration_seconds)
        span.set_attribute("tenant.id", tenant_id)
        _resolution_duration.record(duration_seconds, {"tenant_id": tenant_id, "priority": incident["priority"]})

    _resolved_counter.add(1, {"tenant_id": tenant_id, "priority": incident["priority"]})
    _open_gauge.add(-1, {"tenant_id": tenant_id, "priority": incident["priority"]})

    with _tracer.start_as_current_span("itsm.incident.event_published") as span:
        span.set_attribute("event_type", "incident.resolved")
        span.set_attribute("tenant.id", tenant_id)
        await mq.publish("incident.resolved", {
            "event": "incident.resolved",
            "tenant_id": tenant_id,
            "incident_id": str(incident_id),
            "priority": incident["priority"],
        })

    return IncidentResponse(**incident)


# ── Events ─────────────────────────────────────────────────────────────────────

@router.post("/incidents/{incident_id}/events", response_model=IncidentEventResponse, status_code=201)
async def add_event(
    incident_id: uuid.UUID,
    body: EventCreate,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        exists = await repository.get_incident(session, incident_id)
        if not exists:
            raise HTTPException(status_code=404, detail="Incident not found")
        event = await repository.add_event(session, incident_id, body)
    return IncidentEventResponse(**event)


@router.get("/incidents/{incident_id}/events", response_model=list[IncidentEventResponse])
async def list_events(
    incident_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        events = await repository.list_events(session, incident_id)
    return [IncidentEventResponse(**e) for e in events]
