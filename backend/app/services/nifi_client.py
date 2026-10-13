"""
NiFi REST API Client

Connects to real Apache NiFi instances via the NiFi REST API.
Docs: https://nifi.apache.org/docs/nifi-docs/rest-api/index.html
"""
import httpx
import time
from typing import Optional, Dict, Any, Tuple
from app.config import settings


class NifiClient:
    """
    Client for the Apache NiFi REST API.
    Supports NiFi 1.x and 2.x API endpoints.
    """

    def __init__(self, base_url: str, verify_ssl: bool = False, timeout: float = 15.0):
        """
        Args:
            base_url: NiFi base URL, e.g. http://10.201.216.172:8443
                      (can include /nifi suffix — it will be stripped)
            verify_ssl: Whether to verify SSL certificates
            timeout: HTTP request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        # Strip /nifi or /nifi/ suffix if present
        if self.base_url.endswith("/nifi"):
            self.base_url = self.base_url[:-5]
        self.api_url = f"{self.base_url}/nifi-api"
        self.verify_ssl = verify_ssl
        self.timeout = timeout

    async def check_connection(self) -> Tuple[bool, Optional[str], Optional[float]]:
        """
        Check connectivity to the NiFi instance.
        Returns: (is_connected, nifi_version, response_time_ms)
        """
        try:
            start = time.time()
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=self.timeout) as client:
                resp = await client.get(f"{self.api_url}/flow/about")
                elapsed_ms = (time.time() - start) * 1000
                if resp.status_code == 200:
                    data = resp.json()
                    version = data.get("about", {}).get("version", "unknown")
                    return True, version, elapsed_ms
                return False, None, elapsed_ms
        except Exception as e:
            print(f"[NiFi Client] Connection check failed for {self.base_url}: {e}")
            return False, None, None

    async def get_flow_status(self) -> Optional[Dict[str, Any]]:
        """
        GET /nifi-api/flow/status
        Returns controller-level metrics: running/stopped/invalid counts,
        active threads, queued flowfiles, etc.
        """
        try:
            start = time.time()
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=self.timeout) as client:
                resp = await client.get(f"{self.api_url}/flow/status")
                elapsed_ms = (time.time() - start) * 1000
                if resp.status_code != 200:
                    print(f"[NiFi Client] flow/status returned {resp.status_code}")
                    return None

                data = resp.json()
                cs = data.get("controllerStatus", {})

                return {
                    "active_threads": cs.get("activeThreadCount", 0),
                    "queued_flowfiles": cs.get("flowFilesQueued", 0),
                    "bytes_queued": cs.get("bytesQueued", 0),
                    "running_count": cs.get("runningCount", 0),
                    "stopped_count": cs.get("stoppedCount", 0),
                    "invalid_count": cs.get("invalidCount", 0),
                    "disabled_count": cs.get("disabledCount", 0),
                    "response_time_ms": elapsed_ms,
                }
        except Exception as e:
            print(f"[NiFi Client] Error fetching flow status from {self.base_url}: {e}")
            return None

    async def get_system_diagnostics(self) -> Optional[Dict[str, Any]]:
        """
        GET /nifi-api/system-diagnostics
        Returns JVM heap, CPU, storage info.
        """
        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=self.timeout) as client:
                resp = await client.get(f"{self.api_url}/system-diagnostics")
                if resp.status_code == 200:
                    return resp.json().get("systemDiagnostics", {}).get("aggregateSnapshot", {})
                return None
        except Exception as e:
            print(f"[NiFi Client] Error fetching system diagnostics: {e}")
            return None

    async def get_about(self) -> Optional[Dict[str, Any]]:
        """
        GET /nifi-api/flow/about
        Returns NiFi version and build info.
        """
        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=self.timeout) as client:
                resp = await client.get(f"{self.api_url}/flow/about")
                if resp.status_code == 200:
                    return resp.json().get("about", {})
                return None
        except Exception as e:
            print(f"[NiFi Client] Error fetching about: {e}")
            return None

    async def get_bulletins(self) -> Optional[list]:
        """
        GET /nifi-api/flow/bulletins
        Returns system-level bulletins/warnings.
        """
        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=self.timeout) as client:
                resp = await client.get(f"{self.api_url}/flow/bulletins")
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("bulletinBoard", {}).get("bulletins", [])
                return None
        except Exception as e:
            print(f"[NiFi Client] Error fetching bulletins: {e}")
            return None

    async def poll_all_metrics(self) -> Dict[str, Any]:
        """
        Fetches all key metrics from the NiFi instance in one call.
        Returns a dict ready to update the NifiInstance model.
        """
        # Check connection first
        connected, version, conn_time = await self.check_connection()

        if not connected:
            return {
                "status": "unreachable",
                "response_time_ms": None,
                "nifi_version": version or "unknown",
            }

        # Get flow status metrics
        flow = await self.get_flow_status()

        if not flow:
            return {
                "status": "warning",
                "nifi_version": version or "unknown",
                "response_time_ms": conn_time,
                "notes": "Connected but failed to retrieve flow status",
            }

        # Determine health status based on metrics:
        # Queued files: Warning > 20, Critical > 100
        # Queued size: Warning > 200MB, Critical > 500MB
        # Stopped components: Critical > 100
        # (Invalid components ignored as per user specification)
        queued_files = flow["queued_flowfiles"]
        queued_bytes = flow["bytes_queued"]
        stopped_count = flow["stopped_count"]

        status = "healthy"
        if (
            queued_files > settings.THRESHOLD_FILES_CRITICAL
            or queued_bytes > settings.THRESHOLD_BYTES_CRITICAL
            or stopped_count > settings.THRESHOLD_STOPPED_CRITICAL
        ):
            status = "critical"
        elif (
            queued_files > settings.THRESHOLD_FILES_WARNING
            or queued_bytes > settings.THRESHOLD_BYTES_WARNING
        ):
            status = "warning"


        return {
            "status": status,
            "nifi_version": version or "unknown",
            "process_groups_running": flow["running_count"],
            "process_groups_stopped": flow["stopped_count"],
            "invalid_components": flow["invalid_count"],
            "queued_flowfiles": flow["queued_flowfiles"],
            "bytes_queued": flow["bytes_queued"],
            "active_threads": flow["active_threads"],
            "response_time_ms": flow["response_time_ms"],
        }
