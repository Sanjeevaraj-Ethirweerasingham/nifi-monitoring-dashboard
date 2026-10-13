from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models import Alert, NifiInstance
from app.schemas import AlertResponse, AlertAcknowledge

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    instance_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(Alert).order_by(Alert.created_at.desc())
    if instance_id:
        query = query.where(Alert.instance_id == instance_id)
    if severity:
        query = query.where(Alert.severity == severity)
    if acknowledged is not None:
        query = query.where(Alert.acknowledged == acknowledged)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: int,
    body: AlertAcknowledge,
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = body.acknowledged
    await db.commit()
    await db.refresh(alert)
    return alert
