from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models import MonitoringEvent
from app.schemas import MonitoringEventResponse

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("", response_model=List[MonitoringEventResponse])
async def list_events(
    instance_id: Optional[int] = Query(None),
    event_type: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    query = select(MonitoringEvent).order_by(MonitoringEvent.created_at.desc())
    if instance_id:
        query = query.where(MonitoringEvent.instance_id == instance_id)
    if event_type:
        query = query.where(MonitoringEvent.event_type == event_type)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
