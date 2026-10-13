"""
Demo Data Seeder

Generates realistic demo data for 22 NiFi instances.
All data is clearly marked as demo (is_demo=True).
This data does NOT represent any live NiFi instances.
"""
from datetime import datetime, timedelta
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import NifiInstance, Alert, MonitoringEvent

# Seed for reproducible demo data
random.seed(42)

DEMO_INSTANCES = [
    # Production instances (8)
    {
        "name": "nifi-prod-us-east-01",
        "environment": "production",
        "hostname": "nifi-prod-ue1.corp.example.com",
        "port": 8443,
        "nifi_version": "2.0.0",
        "status": "healthy",
        "process_groups_running": 24,
        "process_groups_stopped": 2,
        "invalid_components": 0,
        "queued_flowfiles": 1240,
        "bytes_queued": 52428800,
        "active_threads": 18,
        "response_time_ms": 145.2,
    },
    {
        "name": "nifi-prod-us-east-02",
        "environment": "production",
        "hostname": "nifi-prod-ue2.corp.example.com",
        "port": 8443,
        "nifi_version": "2.0.0",
        "status": "healthy",
        "process_groups_running": 22,
        "process_groups_stopped": 1,
        "invalid_components": 0,
        "queued_flowfiles": 980,
        "bytes_queued": 41943040,
        "active_threads": 15,
        "response_time_ms": 132.7,
    },
    {
        "name": "nifi-prod-us-west-01",
        "environment": "production",
        "hostname": "nifi-prod-uw1.corp.example.com",
        "port": 8443,
        "nifi_version": "2.0.0",
        "status": "warning",
        "process_groups_running": 20,
        "process_groups_stopped": 4,
        "invalid_components": 3,
        "queued_flowfiles": 45230,
        "bytes_queued": 2147483648,
        "active_threads": 32,
        "response_time_ms": 892.1,
    },
    {
        "name": "nifi-prod-eu-west-01",
        "environment": "production",
        "hostname": "nifi-prod-ew1.corp.example.com",
        "port": 8443,
        "nifi_version": "1.24.0",
        "status": "healthy",
        "process_groups_running": 18,
        "process_groups_stopped": 0,
        "invalid_components": 0,
        "queued_flowfiles": 560,
        "bytes_queued": 20971520,
        "active_threads": 12,
        "response_time_ms": 221.4,
    },
    {
        "name": "nifi-prod-eu-central-01",
        "environment": "production",
        "hostname": "nifi-prod-ec1.corp.example.com",
        "port": 8443,
        "nifi_version": "1.24.0",
        "status": "healthy",
        "process_groups_running": 16,
        "process_groups_stopped": 1,
        "invalid_components": 0,
        "queued_flowfiles": 320,
        "bytes_queued": 10485760,
        "active_threads": 10,
        "response_time_ms": 198.6,
    },
    {
        "name": "nifi-prod-ap-southeast-01",
        "environment": "production",
        "hostname": "nifi-prod-aps1.corp.example.com",
        "port": 8443,
        "nifi_version": "2.0.0",
        "status": "critical",
        "process_groups_running": 5,
        "process_groups_stopped": 15,
        "invalid_components": 8,
        "queued_flowfiles": 125000,
        "bytes_queued": 5368709120,
        "active_threads": 2,
        "response_time_ms": 4521.3,
    },
    {
        "name": "nifi-prod-ap-northeast-01",
        "environment": "production",
        "hostname": "nifi-prod-apn1.corp.example.com",
        "port": 8443,
        "nifi_version": "1.23.2",
        "status": "warning",
        "process_groups_running": 14,
        "process_groups_stopped": 3,
        "invalid_components": 2,
        "queued_flowfiles": 8900,
        "bytes_queued": 314572800,
        "active_threads": 20,
        "response_time_ms": 567.8,
    },
    {
        "name": "nifi-prod-sa-east-01",
        "environment": "production",
        "hostname": "nifi-prod-sae1.corp.example.com",
        "port": 8443,
        "nifi_version": "1.23.2",
        "status": "unreachable",
        "process_groups_running": 0,
        "process_groups_stopped": 0,
        "invalid_components": 0,
        "queued_flowfiles": 0,
        "bytes_queued": 0,
        "active_threads": 0,
        "response_time_ms": None,
    },
    # Staging instances (6)
    {
        "name": "nifi-staging-us-east-01",
        "environment": "staging",
        "hostname": "nifi-stg-ue1.corp.example.com",
        "port": 8080,
        "nifi_version": "2.1.0",
        "status": "healthy",
        "process_groups_running": 12,
        "process_groups_stopped": 2,
        "invalid_components": 1,
        "queued_flowfiles": 450,
        "bytes_queued": 15728640,
        "active_threads": 8,
        "response_time_ms": 88.3,
    },
    {
        "name": "nifi-staging-us-west-01",
        "environment": "staging",
        "hostname": "nifi-stg-uw1.corp.example.com",
        "port": 8080,
        "nifi_version": "2.1.0",
        "status": "healthy",
        "process_groups_running": 10,
        "process_groups_stopped": 1,
        "invalid_components": 0,
        "queued_flowfiles": 230,
        "bytes_queued": 8388608,
        "active_threads": 6,
        "response_time_ms": 76.5,
    },
    {
        "name": "nifi-staging-eu-west-01",
        "environment": "staging",
        "hostname": "nifi-stg-ew1.corp.example.com",
        "port": 8080,
        "nifi_version": "2.0.0",
        "status": "warning",
        "process_groups_running": 8,
        "process_groups_stopped": 3,
        "invalid_components": 2,
        "queued_flowfiles": 3400,
        "bytes_queued": 134217728,
        "active_threads": 14,
        "response_time_ms": 445.2,
    },
    {
        "name": "nifi-staging-eu-central-01",
        "environment": "staging",
        "hostname": "nifi-stg-ec1.corp.example.com",
        "port": 8080,
        "nifi_version": "2.0.0",
        "status": "healthy",
        "process_groups_running": 9,
        "process_groups_stopped": 0,
        "invalid_components": 0,
        "queued_flowfiles": 180,
        "bytes_queued": 5242880,
        "active_threads": 5,
        "response_time_ms": 92.1,
    },
    {
        "name": "nifi-staging-ap-southeast-01",
        "environment": "staging",
        "hostname": "nifi-stg-aps1.corp.example.com",
        "port": 8080,
        "nifi_version": "1.24.0",
        "status": "healthy",
        "process_groups_running": 7,
        "process_groups_stopped": 1,
        "invalid_components": 0,
        "queued_flowfiles": 95,
        "bytes_queued": 3145728,
        "active_threads": 4,
        "response_time_ms": 112.7,
    },
    {
        "name": "nifi-staging-ap-northeast-01",
        "environment": "staging",
        "hostname": "nifi-stg-apn1.corp.example.com",
        "port": 8080,
        "nifi_version": "2.1.0",
        "status": "critical",
        "process_groups_running": 2,
        "process_groups_stopped": 8,
        "invalid_components": 5,
        "queued_flowfiles": 52000,
        "bytes_queued": 2147483648,
        "active_threads": 1,
        "response_time_ms": 3890.4,
    },
    # Development instances (5)
    {
        "name": "nifi-dev-us-east-01",
        "environment": "development",
        "hostname": "nifi-dev-ue1.corp.example.com",
        "port": 8080,
        "nifi_version": "2.1.0",
        "status": "healthy",
        "process_groups_running": 5,
        "process_groups_stopped": 3,
        "invalid_components": 2,
        "queued_flowfiles": 45,
        "bytes_queued": 1048576,
        "active_threads": 3,
        "response_time_ms": 65.2,
    },
    {
        "name": "nifi-dev-us-west-01",
        "environment": "development",
        "hostname": "nifi-dev-uw1.corp.example.com",
        "port": 8080,
        "nifi_version": "2.1.0",
        "status": "warning",
        "process_groups_running": 3,
        "process_groups_stopped": 5,
        "invalid_components": 4,
        "queued_flowfiles": 1200,
        "bytes_queued": 52428800,
        "active_threads": 8,
        "response_time_ms": 320.8,
    },
    {
        "name": "nifi-dev-eu-west-01",
        "environment": "development",
        "hostname": "nifi-dev-ew1.corp.example.com",
        "port": 8080,
        "nifi_version": "2.0.0",
        "status": "healthy",
        "process_groups_running": 4,
        "process_groups_stopped": 2,
        "invalid_components": 0,
        "queued_flowfiles": 28,
        "bytes_queued": 786432,
        "active_threads": 2,
        "response_time_ms": 58.9,
    },
    {
        "name": "nifi-dev-local-sandbox-01",
        "environment": "development",
        "hostname": "localhost",
        "port": 8080,
        "nifi_version": "2.1.0",
        "status": "unreachable",
        "process_groups_running": 0,
        "process_groups_stopped": 0,
        "invalid_components": 0,
        "queued_flowfiles": 0,
        "bytes_queued": 0,
        "active_threads": 0,
        "response_time_ms": None,
    },
    {
        "name": "nifi-dev-shared-01",
        "environment": "development",
        "hostname": "nifi-dev-shared.corp.example.com",
        "port": 8080,
        "nifi_version": "1.24.0",
        "status": "healthy",
        "process_groups_running": 6,
        "process_groups_stopped": 1,
        "invalid_components": 1,
        "queued_flowfiles": 120,
        "bytes_queued": 4194304,
        "active_threads": 4,
        "response_time_ms": 78.3,
    },
    # DR instances (3)
    {
        "name": "nifi-dr-us-east-01",
        "environment": "dr",
        "hostname": "nifi-dr-ue1.corp.example.com",
        "port": 8443,
        "nifi_version": "2.0.0",
        "status": "healthy",
        "process_groups_running": 22,
        "process_groups_stopped": 2,
        "invalid_components": 0,
        "queued_flowfiles": 890,
        "bytes_queued": 37748736,
        "active_threads": 14,
        "response_time_ms": 156.4,
    },
    {
        "name": "nifi-dr-eu-west-01",
        "environment": "dr",
        "hostname": "nifi-dr-ew1.corp.example.com",
        "port": 8443,
        "nifi_version": "1.24.0",
        "status": "healthy",
        "process_groups_running": 16,
        "process_groups_stopped": 1,
        "invalid_components": 0,
        "queued_flowfiles": 450,
        "bytes_queued": 18874368,
        "active_threads": 10,
        "response_time_ms": 234.7,
    },
    {
        "name": "nifi-dr-ap-southeast-01",
        "environment": "dr",
        "hostname": "nifi-dr-aps1.corp.example.com",
        "port": 8443,
        "nifi_version": "2.0.0",
        "status": "warning",
        "process_groups_running": 18,
        "process_groups_stopped": 3,
        "invalid_components": 1,
        "queued_flowfiles": 2100,
        "bytes_queued": 83886080,
        "active_threads": 16,
        "response_time_ms": 389.2,
    },
]

DEMO_ALERTS = [
    # For nifi-prod-us-west-01 (warning)
    {
        "instance_name": "nifi-prod-us-west-01",
        "severity": "warning",
        "title": "High Queue Depth",
        "message": "Flow file queue has exceeded 40,000 items. Current: 45,230. Threshold: 40,000.",
        "acknowledged": False,
        "offset_hours": -2,
    },
    {
        "instance_name": "nifi-prod-us-west-01",
        "severity": "warning",
        "title": "Elevated Response Time",
        "message": "NiFi instance response time is 892ms, exceeding the 500ms warning threshold.",
        "acknowledged": False,
        "offset_hours": -3,
    },
    {
        "instance_name": "nifi-prod-us-west-01",
        "severity": "info",
        "title": "Invalid Components Detected",
        "message": "3 invalid components found in process groups. Manual review required.",
        "acknowledged": True,
        "offset_hours": -5,
    },
    # For nifi-prod-ap-southeast-01 (critical)
    {
        "instance_name": "nifi-prod-ap-southeast-01",
        "severity": "critical",
        "title": "Critical Queue Backlog",
        "message": "CRITICAL: 125,000 flow files queued (5.3 GB). 15 process groups stopped. Immediate action required.",
        "acknowledged": False,
        "offset_hours": -1,
    },
    {
        "instance_name": "nifi-prod-ap-southeast-01",
        "severity": "critical",
        "title": "Multiple Process Groups Stopped",
        "message": "15 out of 20 process groups are in STOPPED state. Possible configuration or connectivity issue.",
        "acknowledged": False,
        "offset_hours": -1,
    },
    {
        "instance_name": "nifi-prod-ap-southeast-01",
        "severity": "critical",
        "title": "High Invalid Component Count",
        "message": "8 invalid components detected. NiFi may not be processing data correctly.",
        "acknowledged": False,
        "offset_hours": -2,
    },
    {
        "instance_name": "nifi-prod-ap-southeast-01",
        "severity": "warning",
        "title": "Extremely High Response Time",
        "message": "Response time is 4,521ms. Node may be under severe load or starved for resources.",
        "acknowledged": False,
        "offset_hours": -1,
    },
    # For nifi-prod-sa-east-01 (unreachable)
    {
        "instance_name": "nifi-prod-sa-east-01",
        "severity": "critical",
        "title": "Instance Unreachable",
        "message": "Cannot connect to nifi-prod-sae1.corp.example.com:8443. Instance has been unreachable for 47 minutes.",
        "acknowledged": False,
        "offset_hours": -1,
    },
    {
        "instance_name": "nifi-prod-sa-east-01",
        "severity": "critical",
        "title": "Monitoring Check Failed",
        "message": "Health check failed 3 consecutive times. Last successful check: 47 minutes ago.",
        "acknowledged": False,
        "offset_hours": -1,
    },
    # For nifi-prod-ap-northeast-01 (warning)
    {
        "instance_name": "nifi-prod-ap-northeast-01",
        "severity": "warning",
        "title": "Elevated Queue Depth",
        "message": "8,900 flow files in queue. Monitoring for further increase.",
        "acknowledged": True,
        "offset_hours": -6,
    },
    {
        "instance_name": "nifi-prod-ap-northeast-01",
        "severity": "warning",
        "title": "Invalid Components",
        "message": "2 invalid components detected. Review processor configuration.",
        "acknowledged": False,
        "offset_hours": -4,
    },
    # For nifi-staging-eu-west-01 (warning)
    {
        "instance_name": "nifi-staging-eu-west-01",
        "severity": "warning",
        "title": "Queue Depth Warning",
        "message": "3,400 flow files queued in staging environment. Check for stuck processors.",
        "acknowledged": True,
        "offset_hours": -8,
    },
    # For nifi-staging-ap-northeast-01 (critical)
    {
        "instance_name": "nifi-staging-ap-northeast-01",
        "severity": "critical",
        "title": "Staging Critical - Data Pipeline Stopped",
        "message": "Major test pipeline in staging is stopped. 52,000 events backlogged. QA team notified.",
        "acknowledged": False,
        "offset_hours": -3,
    },
    {
        "instance_name": "nifi-staging-ap-northeast-01",
        "severity": "critical",
        "title": "5 Invalid Components",
        "message": "5 components invalid after recent configuration deployment. Rollback may be required.",
        "acknowledged": False,
        "offset_hours": -3,
    },
    # For nifi-dev-us-west-01 (warning)
    {
        "instance_name": "nifi-dev-us-west-01",
        "severity": "warning",
        "title": "Dev Environment Queue Buildup",
        "message": "1,200 flow files queued. Likely caused by developer testing with high-volume data.",
        "acknowledged": True,
        "offset_hours": -12,
    },
    # For nifi-dev-local-sandbox-01 (unreachable)
    {
        "instance_name": "nifi-dev-local-sandbox-01",
        "severity": "warning",
        "title": "Local Sandbox Unreachable",
        "message": "Local sandbox instance at localhost:8080 is not responding. May be stopped intentionally.",
        "acknowledged": True,
        "offset_hours": -24,
    },
    # For nifi-dr-ap-southeast-01 (warning)
    {
        "instance_name": "nifi-dr-ap-southeast-01",
        "severity": "warning",
        "title": "DR Queue Monitoring",
        "message": "DR instance queue depth at 2,100. Monitoring sync latency from primary region.",
        "acknowledged": False,
        "offset_hours": -4,
    },
]

DEMO_EVENTS = [
    {
        "instance_name": "nifi-prod-us-east-01",
        "event_type": "health_check",
        "details": "Health check passed. All systems nominal.",
        "offset_hours": -0.25,
    },
    {
        "instance_name": "nifi-prod-us-east-01",
        "event_type": "health_check",
        "details": "Health check passed. All systems nominal.",
        "offset_hours": -0.5,
    },
    {
        "instance_name": "nifi-prod-us-east-01",
        "event_type": "health_check",
        "details": "Health check passed. All systems nominal.",
        "offset_hours": -1,
    },
    {
        "instance_name": "nifi-prod-ap-southeast-01",
        "event_type": "alert_triggered",
        "details": "CRITICAL alert triggered: queue depth exceeded threshold. Automatic escalation initiated.",
        "offset_hours": -1,
    },
    {
        "instance_name": "nifi-prod-ap-southeast-01",
        "event_type": "health_check",
        "details": "Health check FAILED. Response time: 4521ms. Status: CRITICAL.",
        "offset_hours": -1,
    },
    {
        "instance_name": "nifi-prod-ap-southeast-01",
        "event_type": "health_check",
        "details": "Health check FAILED. Multiple process groups stopped.",
        "offset_hours": -1.5,
    },
    {
        "instance_name": "nifi-prod-sa-east-01",
        "event_type": "connection_lost",
        "details": "Connection to instance lost. Attempting reconnect...",
        "offset_hours": -0.75,
    },
    {
        "instance_name": "nifi-prod-sa-east-01",
        "event_type": "health_check",
        "details": "Health check FAILED. Connection timeout after 30 seconds.",
        "offset_hours": -0.5,
    },
    {
        "instance_name": "nifi-prod-sa-east-01",
        "event_type": "health_check",
        "details": "Health check FAILED. Connection timeout after 30 seconds.",
        "offset_hours": -0.25,
    },
    {
        "instance_name": "nifi-prod-us-west-01",
        "event_type": "alert_triggered",
        "details": "WARNING: Queue depth 45,230 exceeded threshold 40,000.",
        "offset_hours": -2,
    },
    {
        "instance_name": "nifi-prod-us-west-01",
        "event_type": "health_check",
        "details": "Health check WARNING. Response time degraded: 892ms.",
        "offset_hours": -2,
    },
    {
        "instance_name": "nifi-staging-ap-northeast-01",
        "event_type": "alert_triggered",
        "details": "CRITICAL: Staging pipeline stopped. 5 invalid components after deployment.",
        "offset_hours": -3,
    },
    {
        "instance_name": "nifi-staging-us-east-01",
        "event_type": "config_change",
        "details": "NiFi version updated from 2.0.0 to 2.1.0. Restart completed successfully.",
        "offset_hours": -12,
    },
    {
        "instance_name": "nifi-prod-eu-west-01",
        "event_type": "health_check",
        "details": "Health check passed. Response time: 221ms.",
        "offset_hours": -0.25,
    },
    {
        "instance_name": "nifi-dr-us-east-01",
        "event_type": "health_check",
        "details": "DR health check passed. Sync with primary region current.",
        "offset_hours": -0.5,
    },
]


async def seed_demo_data(db: AsyncSession) -> None:
    """
    Seeds the database with demo data if no instances exist.
    All seeded records have is_demo=True.
    """
    # Check if data already exists
    result = await db.execute(select(NifiInstance).limit(1))
    if result.scalar_one_or_none() is not None:
        print("[Demo] Demo data already seeded, skipping.")
        return

    print("[Demo] Seeding demo data for 22 NiFi instances...")
    now = datetime.utcnow()

    # Create instances
    instance_map = {}
    for data in DEMO_INSTANCES:
        last_checked = (
            now - timedelta(minutes=random.randint(1, 15))
            if data["status"] != "unreachable"
            else now - timedelta(minutes=random.randint(45, 90))
        )
        instance = NifiInstance(
            name=data["name"],
            environment=data["environment"],
            hostname=data["hostname"],
            port=data["port"],
            nifi_version=data["nifi_version"],
            status=data["status"],
            process_groups_running=data["process_groups_running"],
            process_groups_stopped=data["process_groups_stopped"],
            invalid_components=data["invalid_components"],
            queued_flowfiles=data["queued_flowfiles"],
            bytes_queued=data["bytes_queued"],
            active_threads=data["active_threads"],
            response_time_ms=data["response_time_ms"],
            last_checked=last_checked,
            is_demo=True,
        )
        db.add(instance)
        await db.flush()  # get the id
        instance_map[data["name"]] = instance

    # Create alerts
    for alert_data in DEMO_ALERTS:
        instance = instance_map.get(alert_data["instance_name"])
        if not instance:
            continue
        alert = Alert(
            instance_id=instance.id,
            severity=alert_data["severity"],
            title=alert_data["title"],
            message=alert_data["message"],
            acknowledged=alert_data["acknowledged"],
            created_at=now + timedelta(hours=alert_data["offset_hours"]),
        )
        db.add(alert)

    # Create events
    for event_data in DEMO_EVENTS:
        instance = instance_map.get(event_data["instance_name"])
        if not instance:
            continue
        event = MonitoringEvent(
            instance_id=instance.id,
            event_type=event_data["event_type"],
            details=event_data["details"],
            created_at=now + timedelta(hours=event_data["offset_hours"]),
        )
        db.add(event)

    await db.commit()
    print(
        f"[Demo] Seeded {len(DEMO_INSTANCES)} instances, "
        f"{len(DEMO_ALERTS)} alerts, {len(DEMO_EVENTS)} events."
    )
