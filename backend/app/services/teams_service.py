"""
Microsoft Teams Notification Service

Dispatches rich Adaptive Cards to Microsoft Teams channels via Webhooks / Power Automate.
"""
import httpx
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.config import settings

STATUS_COLOR_MAP = {
    "healthy": "Good",
    "warning": "Warning",
    "critical": "Attention",
    "unreachable": "Attention",
}

STATUS_EMOJI_MAP = {
    "healthy": "🟢",
    "warning": "🟡",
    "critical": "🔴",
    "unreachable": "⚪",
}

def format_bytes(b: int) -> str:
    """Format bytes into readable units."""
    if not b or b == 0:
        return "0 B"
    k = 1024
    sizes = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(b, k)))
    i = min(i, len(sizes) - 1)
    val = round(b / (k ** i), 1)
    return f"{val} {sizes[i]}"


async def send_teams_payload(payload: Dict[str, Any]) -> bool:
    """Send arbitrary JSON payload to the configured Teams webhook URL."""
    if not settings.TEAMS_NOTIFICATIONS_ENABLED or not settings.TEAMS_WEBHOOK_URL:
        print("[Teams] Notifications disabled or webhook URL not configured.")
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                settings.TEAMS_WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            if resp.status_code in (200, 202):
                print(f"[Teams] Notification successfully posted (HTTP {resp.status_code}).")
                return True
            else:
                print(f"[Teams] Webhook request returned HTTP {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        print(f"[Teams] Failed to send webhook: {e}")
        return False

async def notify_status_summary(instances: list, title: str = "Apache NiFi Status Report") -> bool:
    """
    Sends an aggregated status card of all monitored NiFi instances to Teams.
    """
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    healthy = sum(1 for i in instances if i.status == "healthy")
    warning = sum(1 for i in instances if i.status == "warning")
    critical = sum(1 for i in instances if i.status == "critical")
    unreachable = sum(1 for i in instances if i.status == "unreachable")
    total = len(instances)

    facts = [
        {"title": "Total Clusters", "value": f"{total}"},
        {"title": "Healthy", "value": f"🟢 {healthy}"},
        {"title": "Warning", "value": f"🟡 {warning}"},
        {"title": "Critical", "value": f"🔴 {critical}"},
        {"title": "Report Time", "value": now_str},
    ]

    # Build cluster lines: only show IP, Queue Size, and Queue Files
    instance_blocks = []
    for inst in instances:
        emoji = STATUS_EMOJI_MAP.get(inst.status, "⚪")
        formatted_size = format_bytes(inst.bytes_queued or 0)
        queued_files_count = inst.queued_flowfiles or 0

        instance_blocks.append({
            "type": "ColumnSet",
            "columns": [
                {
                    "type": "Column",
                    "width": "stretch",
                    "items": [
                        {
                            "type": "TextBlock",
                            "text": f"**{inst.name}** ({inst.environment.upper()})",
                            "wrap": True,
                            "weight": "Bolder"
                        },
                        {
                            "type": "TextBlock",
                            "text": f"`{inst.hostname}:{inst.port}`",
                            "isSubtle": True,
                            "size": "Small",
                            "spacing": "None"
                        },
                        {
                            "type": "TextBlock",
                            "text": f"Queue: **{queued_files_count:,}** files  •  **{formatted_size}**",
                            "size": "Small",
                            "wrap": True,
                            "spacing": "None"
                        }
                    ]
                },
                {
                    "type": "Column",
                    "width": "auto",
                    "items": [
                        {
                            "type": "TextBlock",
                            "text": f"{emoji} {inst.status.upper()}",
                            "color": STATUS_COLOR_MAP.get(inst.status, "Default"),
                            "weight": "Bolder"
                        }
                    ]
                }
            ],
            "separator": True
        })



    adaptive_card = {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.4",
                    "body": [
                        {
                            "type": "TextBlock",
                            "size": "Large",
                            "weight": "Bolder",
                            "text": f"🔔 {title}",
                            "color": "Accent"
                        },
                        {
                            "type": "FactSet",
                            "facts": facts
                        },
                        {
                            "type": "TextBlock",
                            "text": "**Monitored NiFi Clusters:**",
                            "weight": "Bolder",
                            "spacing": "Medium"
                        },
                        *instance_blocks
                    ]
                }
            }
        ]
    }

    return await send_teams_payload(adaptive_card)

async def notify_instance_alert(instance, alert_title: str, alert_message: str, severity: str = "critical") -> bool:
    """
    Sends an immediate single-cluster alert card to Teams when an incident or state degradation occurs.
    """
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    emoji = STATUS_EMOJI_MAP.get(severity, "🔴")

    adaptive_card = {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.4",
                    "body": [
                        {
                            "type": "TextBlock",
                            "size": "Large",
                            "weight": "Bolder",
                            "text": f"{emoji} NiFi Alert: {instance.name}",
                            "color": STATUS_COLOR_MAP.get(severity, "Attention")
                        },
                        {
                            "type": "TextBlock",
                            "text": f"**{alert_title}**",
                            "weight": "Bolder"
                        },
                        {
                            "type": "TextBlock",
                            "text": alert_message,
                            "wrap": True
                        },
                        {
                            "type": "FactSet",
                            "facts": [
                                {"title": "Instance", "value": instance.name},
                                {"title": "Environment", "value": instance.environment.upper()},
                                {"title": "Host", "value": f"{instance.hostname}:{instance.port}"},
                                {"title": "Status", "value": f"{emoji} {instance.status.upper()}"},
                                {"title": "Queue Files", "value": f"{(instance.queued_flowfiles or 0):,}"},
                                {"title": "Queue Size", "value": format_bytes(instance.bytes_queued or 0)},
                                {"title": "Triggered At", "value": now_str}
                            ]
                        }

                    ]
                }
            }
        ]
    }

    return await send_teams_payload(adaptive_card)
