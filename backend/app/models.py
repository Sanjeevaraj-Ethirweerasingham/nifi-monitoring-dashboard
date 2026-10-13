from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum

class InstanceStatus(str, enum.Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNREACHABLE = "unreachable"

class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class Environment(str, enum.Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    DR = "dr"

class NifiInstance(Base):
    __tablename__ = "nifi_instances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    environment: Mapped[str] = mapped_column(String(50), nullable=False)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    port: Mapped[int] = mapped_column(Integer, default=8080)
    nifi_version: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="healthy")
    process_groups_running: Mapped[int] = mapped_column(Integer, default=0)
    process_groups_stopped: Mapped[int] = mapped_column(Integer, default=0)
    invalid_components: Mapped[int] = mapped_column(Integer, default=0)
    queued_flowfiles: Mapped[int] = mapped_column(Integer, default=0)
    bytes_queued: Mapped[int] = mapped_column(Integer, default=0)
    active_threads: Mapped[int] = mapped_column(Integer, default=0)
    response_time_ms: Mapped[float] = mapped_column(Float, nullable=True)
    last_checked: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    alerts: Mapped[list["Alert"]] = relationship(back_populates="instance", cascade="all, delete-orphan")
    events: Mapped[list["MonitoringEvent"]] = relationship(back_populates="instance", cascade="all, delete-orphan")

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    instance_id: Mapped[int] = mapped_column(ForeignKey("nifi_instances.id"), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    instance: Mapped["NifiInstance"] = relationship(back_populates="alerts")

class MonitoringEvent(Base):
    __tablename__ = "monitoring_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    instance_id: Mapped[int] = mapped_column(ForeignKey("nifi_instances.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    instance: Mapped["NifiInstance"] = relationship(back_populates="events")
