from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Asset, AssetCreate, AssetUpdate, IncidentSummary


async def list_assets(
    session: AsyncSession,
    asset_type: str | None,
    status: str | None,
    limit: int,
    offset: int,
) -> tuple[list[dict], int]:
    q = select(Asset)
    if asset_type:
        q = q.where(Asset.asset_type == asset_type)
    if status:
        q = q.where(Asset.status == status)

    total_q = select(func.count()).select_from(q.subquery())
    total = (await session.execute(total_q)).scalar_one()

    rows = (await session.execute(q.order_by(Asset.created_at.desc()).limit(limit).offset(offset))).scalars().all()
    return [r.to_dict() for r in rows], total


async def get_asset(session: AsyncSession, asset_id: uuid.UUID) -> dict | None:
    row = (await session.execute(select(Asset).where(Asset.id == asset_id))).scalar_one_or_none()
    return row.to_dict() if row else None


async def create_asset(session: AsyncSession, data: AssetCreate) -> dict:
    asset = Asset(
        name=data.name,
        asset_type=data.asset_type,
        serial_number=data.serial_number,
        status=data.status,
        location=data.location,
        assigned_to=data.assigned_to,
        purchased_at=data.purchased_at,
        warranty_until=data.warranty_until,
        asset_metadata=data.metadata,
    )
    session.add(asset)
    await session.commit()
    await session.refresh(asset)
    return asset.to_dict()


async def update_asset(
    session: AsyncSession, asset_id: uuid.UUID, data: AssetUpdate
) -> dict | None:
    row = (await session.execute(select(Asset).where(Asset.id == asset_id))).scalar_one_or_none()
    if not row:
        return None

    old_status = row.status
    if data.name is not None:
        row.name = data.name
    if data.asset_type is not None:
        row.asset_type = data.asset_type
    if data.serial_number is not None:
        row.serial_number = data.serial_number
    if data.status is not None:
        row.status = data.status
    if data.location is not None:
        row.location = data.location
    if data.assigned_to is not None:
        row.assigned_to = data.assigned_to
    if data.purchased_at is not None:
        row.purchased_at = data.purchased_at
    if data.warranty_until is not None:
        row.warranty_until = data.warranty_until
    if data.metadata is not None:
        row.asset_metadata = data.metadata

    await session.commit()
    await session.refresh(row)
    return row.to_dict(), old_status


async def delete_asset(session: AsyncSession, asset_id: uuid.UUID) -> bool:
    result = await session.execute(delete(Asset).where(Asset.id == asset_id))
    await session.commit()
    return result.rowcount > 0


async def get_asset_incidents(session: AsyncSession, asset_id: uuid.UUID) -> list[dict]:
    rows = (
        await session.execute(
            select(IncidentSummary)
            .where(IncidentSummary.related_asset == asset_id)
            .order_by(IncidentSummary.created_at.desc())
        )
    ).scalars().all()
    return [r.to_dict() for r in rows]
