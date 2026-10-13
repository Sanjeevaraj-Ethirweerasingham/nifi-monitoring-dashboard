from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional
from app.database import get_db
from app.models import NifiInstance, Alert
from app.schemas import (
    NifiInstanceResponse,
    NifiInstanceDetail,
    NifiInstanceCreate,
    NifiInstanceUpdate,
    DashboardSummary,
    PaginatedInstances,
)

router = APIRouter(prefix="/api/instances", tags=["instances"])

@router.get("/summary", response_model=DashboardSummary)
async def get_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NifiInstance))
    instances = result.scalars().all()

    alerts_result = await db.execute(select(Alert))
    all_alerts = alerts_result.scalars().all()

    return DashboardSummary(
        total=len(instances),
        healthy=sum(1 for i in instances if i.status == "healthy"),
        warning=sum(1 for i in instances if i.status == "warning"),
        critical=sum(1 for i in instances if i.status == "critical"),
        unreachable=sum(1 for i in instances if i.status == "unreachable"),
        total_alerts=len(all_alerts),
        unacknowledged_alerts=sum(1 for a in all_alerts if not a.acknowledged),
        is_demo=any(i.is_demo for i in instances),
    )

@router.get("", response_model=PaginatedInstances)
async def list_instances(
    search: Optional[str] = Query(None),
    environment: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort_by: str = Query("name"),
    sort_dir: str = Query("asc"),
    db: AsyncSession = Depends(get_db),
):
    query = select(NifiInstance)

    if search:
        query = query.where(
            or_(
                NifiInstance.name.ilike(f"%{search}%"),
                NifiInstance.hostname.ilike(f"%{search}%"),
                NifiInstance.environment.ilike(f"%{search}%"),
            )
        )
    if environment:
        query = query.where(NifiInstance.environment == environment)
    if status:
        query = query.where(NifiInstance.status == status)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Sort
    sort_col = getattr(NifiInstance, sort_by, NifiInstance.name)
    if sort_dir == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedInstances(items=items, total=total, page=page, page_size=page_size)

@router.get("/{instance_id}", response_model=NifiInstanceDetail)
async def get_instance(instance_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(NifiInstance)
        .options(selectinload(NifiInstance.alerts), selectinload(NifiInstance.events))
        .where(NifiInstance.id == instance_id)
    )
    instance = result.scalar_one_or_none()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    return instance

@router.post("/{instance_id}/poll", response_model=NifiInstanceDetail)
async def poll_instance(instance_id: int, db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    from sqlalchemy.orm import selectinload
    from app.services.nifi_client import NifiClient
    from app.models import MonitoringEvent

    result = await db.execute(
        select(NifiInstance)
        .options(selectinload(NifiInstance.alerts), selectinload(NifiInstance.events))
        .where(NifiInstance.id == instance_id)
    )
    instance = result.scalar_one_or_none()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    if not instance.is_demo:
        url = f"http://{instance.hostname}:{instance.port}/nifi"
        client = NifiClient(url)
        metrics = await client.poll_all_metrics()
        for k, v in metrics.items():
            if hasattr(instance, k):
                setattr(instance, k, v)
        instance.last_checked = datetime.utcnow()
        
        event = MonitoringEvent(
            instance_id=instance.id,
            event_type="health_check",
            details=f"Live poll: status={instance.status}, running={instance.process_groups_running}, stopped={instance.process_groups_stopped}",
            created_at=datetime.utcnow()
        )
        db.add(event)
        await db.commit()
        await db.refresh(instance)

    return instance

@router.post("", response_model=NifiInstanceDetail)
async def create_instance(payload: NifiInstanceCreate, db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    from app.services.nifi_client import NifiClient
    from app.models import MonitoringEvent

    # Check if name already exists
    existing = await db.execute(select(NifiInstance).where(NifiInstance.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An instance with this name already exists")

    # Poll initially to get live telemetry
    client = NifiClient(f"http://{payload.hostname}:{payload.port}/nifi")
    metrics = await client.poll_all_metrics()

    instance = NifiInstance(
        name=payload.name,
        environment=payload.environment,
        hostname=payload.hostname,
        port=payload.port,
        nifi_version=metrics.get("nifi_version") or payload.nifi_version or "unknown",
        status=metrics.get("status", "healthy"),
        process_groups_running=metrics.get("process_groups_running", 0),
        process_groups_stopped=metrics.get("process_groups_stopped", 0),
        invalid_components=metrics.get("invalid_components", 0),
        queued_flowfiles=metrics.get("queued_flowfiles", 0),
        bytes_queued=metrics.get("bytes_queued", 0),
        active_threads=metrics.get("active_threads", 0),
        response_time_ms=metrics.get("response_time_ms"),
        last_checked=datetime.utcnow(),
        is_demo=False,
        notes=payload.notes,
        created_at=datetime.utcnow(),
    )
    db.add(instance)
    await db.flush()

    event = MonitoringEvent(
        instance_id=instance.id,
        event_type="connection_established",
        details=f"Instance registered and initial health checked ({instance.status})",
        created_at=datetime.utcnow(),
    )
    db.add(event)
    await db.commit()

    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(NifiInstance)
        .options(selectinload(NifiInstance.alerts), selectinload(NifiInstance.events))
        .where(NifiInstance.id == instance.id)
    )
    return result.scalar_one()

@router.put("/{instance_id}", response_model=NifiInstanceResponse)
async def update_instance(instance_id: int, payload: NifiInstanceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NifiInstance).where(NifiInstance.id == instance_id))
    instance = result.scalar_one_or_none()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(instance, field, val)

    await db.commit()
    await db.refresh(instance)
    return instance

@router.delete("/{instance_id}")
async def delete_instance(instance_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NifiInstance).where(NifiInstance.id == instance_id))
    instance = result.scalar_one_or_none()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    await db.delete(instance)
    await db.commit()
    return {"message": "Instance deleted successfully", "id": instance_id}

@router.post("/notify-teams")
async def trigger_teams_notification(db: AsyncSession = Depends(get_db)):
    from app.services.teams_service import notify_status_summary
    result = await db.execute(select(NifiInstance))
    instances = result.scalars().all()
    success = await notify_status_summary(instances, title="Manual Status Update")
    if not success:
        raise HTTPException(status_code=500, detail="Failed to post notification to Teams. Verify Webhook URL.")
    return {"status": "ok", "message": "Notification successfully sent to Microsoft Teams", "count": len(instances)}

