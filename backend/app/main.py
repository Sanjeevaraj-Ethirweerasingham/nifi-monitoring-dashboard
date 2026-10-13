import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.config import settings
from app.database import create_tables, AsyncSessionLocal
from app.models import NifiInstance, MonitoringEvent
from app.services.nifi_client import NifiClient
from app.routers import instances, alerts, events

async def poll_all_instances_loop():
    """Background task continuously polling all live registered NiFi instances."""
    while True:
        try:
            await asyncio.sleep(settings.POLL_INTERVAL_SECONDS)
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(NifiInstance).where(NifiInstance.is_demo == False))
                live_instances = result.scalars().all()
                for inst in live_instances:
                    try:
                        old_status = inst.status
                        url = f"http://{inst.hostname}:{inst.port}/nifi"
                        client = NifiClient(url, timeout=10.0)
                        metrics = await client.poll_all_metrics()
                        for k, v in metrics.items():
                            if hasattr(inst, k):
                                setattr(inst, k, v)
                        inst.last_checked = datetime.utcnow()

                        # Dispatch alert to Teams if status transitioned to critical or warning
                        new_status = inst.status
                        if new_status in ("critical", "unreachable") and new_status != old_status:
                            from app.services.teams_service import notify_instance_alert
                            await notify_instance_alert(
                                instance=inst,
                                alert_title=f"Cluster transitioned to {new_status.upper()}",
                                alert_message=f"Instance {inst.name} ({inst.environment}) changed status from {old_status} to {new_status}. Queued Files: {inst.queued_flowfiles}, Queued Size: {round(inst.bytes_queued / (1024*1024), 2)} MB, Stopped Components: {inst.process_groups_stopped}.",
                                severity=new_status,
                            )
                    except Exception as err:
                        print(f"[Poller] Error polling instance {inst.name}: {err}")
                await db.commit()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[Poller] Unexpected error in polling loop: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"Starting {settings.APP_NAME} (Production)...")
    await create_tables()

    # Ensure HMG UAT NiFi is present if DB is completely fresh
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(NifiInstance).where(NifiInstance.name == "HMG UAT NiFi"))
        hmg = res.scalar_one_or_none()
        if not hmg:
            client = NifiClient("http://10.201.216.172:8443/nifi", timeout=10.0)
            metrics = await client.poll_all_metrics()
            hmg = NifiInstance(
                name="HMG UAT NiFi",
                environment="staging",
                hostname="10.201.216.172",
                port=8443,
                nifi_version=metrics.get("nifi_version", "1.28.1"),
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
                notes="Live Apache NiFi instance connected via REST API (http://10.201.216.172:8443/nifi/)",
                created_at=datetime.utcnow(),
            )
            db.add(hmg)
            await db.flush()
            evt = MonitoringEvent(
                instance_id=hmg.id,
                event_type="connection_established",
                details="Initial connection established with HMG UAT NiFi via REST API",
                created_at=datetime.utcnow(),
            )
            db.add(evt)
            await db.commit()

    # Start background polling worker
    polling_task = asyncio.create_task(poll_all_instances_loop())
    yield
    # Shutdown
    print("Shutting down background poller...")
    polling_task.cancel()
    await asyncio.gather(polling_task, return_exceptions=True)
    print("Poller stopped.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Centralized Apache NiFi Monitoring Dashboard API — Production Grade Live Telemetry",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(instances.router)
app.include_router(alerts.router)
app.include_router(events.router)

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "phase": "Phase 1 - Demo Data",
        "docs": "/docs",
        "status": "running",
    }

@app.get("/health")
async def health():
    return {"status": "ok"}
