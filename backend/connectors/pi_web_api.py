"""
Documented Interface: OSIsoft / AVEVA PI Web API Connector (Read-Only)
STATUS: DOCUMENTED INTERFACE / DISCONNECTED IN PROTOTYPE MODE

In production at a coal-fired power plant, this module connects to the
plant's PI Asset Framework (AF) or Data Archive via HTTPS REST to extract
combustion and CEMS tags without placing any write or control load on DCS.
"""

import os
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class PIWebApiConnector:
    def __init__(
        self,
        base_url: Optional[str] = None,
        web_id_database: Optional[str] = None,
        verify_ssl: bool = True
    ):
        # Configuration read strictly from server-side environment variables
        self.base_url = base_url or os.getenv("PI_WEB_API_BASE_URL", "https://pi-server.powerplant.internal/piwebapi")
        self.web_id_database = web_id_database or os.getenv("PI_AF_DATABASE_WEBID", "")
        self.verify_ssl = verify_ssl
        self.is_connected = False  # Explicitly honest status: Disconnected in prototype

    def get_connection_status(self) -> Dict[str, Any]:
        """
        Returns connector health and honest status.
        Never fabricates a live connection when offline.
        """
        return {
            "connector": "OSIsoft PI Web API (Read-Only)",
            "status": "DISCONNECTED (Awaiting plant network gateway configuration)",
            "server_configured": bool(self.base_url),
            "read_only_enforced": True,
            "security_mode": "Windows Integrated / Kerberos delegation with DCS read-only replica"
        }

    def fetch_current_boiler_tags(self, unit_id: str = "Unit 1") -> Dict[str, float]:
        """
        Documented schema for polling real-time 1-minute snapshot values.
        Tag mapping examples:
        - 10HAA10CT001: Unit Load MW (Generator gross output)
        - 10HNA10CF001: Total Coal Feed Rate (t/h)
        - 10HLA10CF001: Total Combustion Air Flow (kNm3/h)
        - 10HHA10CQ001: Flue Gas O2 at Economizer Exit (%)
        - 10HHA20CT001: Furnace Exit Gas Temp FEGT (°C)
        - 10HNA20CP001: SOFA Damper Position (%)
        - 10HKA10CF001: SCR DeNOx Ammonia Injection Flow (kg/h)
        - 10CEMS_NOX_MG: Stack NOx CEMS Concentration (mg/Nm3 @ 6% O2 dry)
        """
        if not self.is_connected:
            raise ConnectionError(
                "PI Web API is currently disconnected in prototype mode. "
                "Use the historical CSV upload or demo mode."
            )
        # Production execution:
        # response = requests.get(f"{self.base_url}/streams/{self.web_id_database}/value", ...)
        return {}
