"""
Analysis Service — WebSocket Manager

Pushes final analysis results to the CentralServer's
broadcast endpoint, which forwards to all connected frontend WebSocket clients.

Architecture:
  Analysis Service
    → POST /api/analysis-update  (CentralServer)
      → broadcast to all WS clients
        → Frontend updates AI panels in real-time
"""

import asyncio
import logging
from typing import Optional

import aiohttp
from config import config

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Responsible for pushing analysis results to the CentralServer
    so it can broadcast them to all connected frontend WebSocket clients.
    """

    def __init__(self):
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10)
            )
        return self._session

    async def push_update(self, payload: dict) -> bool:
        """
        POST the final merged analysis result to CentralServer.
        CentralServer broadcasts it via WebSocket to all connected frontends.

        Returns True on success, False on failure (non-blocking — never raises).
        """
        system_id = payload.get("system_info", {}).get("system_id", "unknown")

        try:
            session = await self._get_session()
            async with session.post(
                config.CENTRAL_SERVER_WS_PUSH_ENDPOINT,
                json=payload,
                headers={"Content-Type": "application/json"},
            ) as resp:
                if resp.status == 200:
                    logger.info(f"WS push successful for {system_id} → CentralServer")
                    return True
                else:
                    body = await resp.text()
                    logger.warning(
                        f"WS push got HTTP {resp.status} for {system_id}: {body[:200]}"
                    )
                    return False

        except aiohttp.ClientConnectorError:
            logger.warning(
                f"CentralServer not reachable at {config.CENTRAL_SERVER_WS_PUSH_ENDPOINT}. "
                f"WebSocket update skipped for {system_id}."
            )
            return False
        except asyncio.TimeoutError:
            logger.warning(f"WS push timed out for {system_id}.")
            return False
        except Exception as e:
            logger.error(f"Unexpected error in WS push for {system_id}: {e}")
            return False

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()


# Module-level singleton
ws_manager = WebSocketManager()
