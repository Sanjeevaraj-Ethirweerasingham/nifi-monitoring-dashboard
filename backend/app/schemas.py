from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

# NifiInstance Schemas
class NifiInstanceBase(BaseModel):
    name: str
    environment: str
    hostname: str
    port: int = 8080
    nifi_version: str
    notes: Optional[str] = None

class NifiInstanceCreate(BaseModel):
    name: str
    environment: str = "production"
    hostname: str
    port: int = 8080
    nifi_version: Optional[str] = "1.28.1"
    notes: Optional[str] = None

class NifiInstanceUpdate(BaseModel):
    name: Optional[str] = None
    environment: Optional[str] = None
    hostname: Optional[str] = None
    port: Optional[int] = None
    nifi_version: Optional[str] = None
    notes: Optional[str] = None


class NifiInstanceResponse(NifiInstanceBase):
    id: int
    status: str
    process_groups_running: int
    process_groups_stopped: int
    invalid_components: int
    queued_flowfiles: int
    bytes_queued: int
    active_threads: int
    response_time_ms: Optional[float]
    last_checked: Optional[datetime]
    is_demo: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class NifiInstanceDetail(NifiInstanceResponse):
    alerts: List["AlertResponse"] = []
    events: List["MonitoringEventResponse"] = []

# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    instance_id: int
    severity: str
    title: str
    message: str
    acknowledged: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class AlertAcknowledge(BaseModel):
    acknowledged: bool = True

# MonitoringEvent Schemas
class MonitoringEventResponse(BaseModel):
    id: int
    instance_id: int
    event_type: str
    details: str
    created_at: datetime

    model_config = {"from_attributes": True}

# Summary / KPI
class DashboardSummary(BaseModel):
    total: int
    healthy: int
    warning: int
    critical: int
    unreachable: int
    total_alerts: int
    unacknowledged_alerts: int
    is_demo: bool

class PaginatedInstances(BaseModel):
    items: List[NifiInstanceResponse]
    total: int
    page: int
    page_size: int
