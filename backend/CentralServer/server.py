import logging
import json
import os
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Dict, Any, Set

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from aiokafka import AIOKafkaProducer

# 🔹 Configuration from Environment
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TELEMETRY_TOPIC = os.getenv("TELEMETRY_TOPIC", "telemetry")
HEARTBEAT_TOPIC = os.getenv("HEARTBEAT_TOPIC", "heartbeat")

# 🔹 Logger Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger("metrics-server")

# 🔹 Kafka Producer (global)
producer: AIOKafkaProducer = None

# 🔹 WebSocket connection registry — active frontend clients
_ws_clients: Set[WebSocket] = set()

# 🔹 In-memory store for latest analysis results per system
_latest_analysis: Dict[str, Any] = {}


# 🚀 Lifespan Management (Startup/Shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    global producer
    logger.info(f"Connecting to Kafka at {KAFKA_BOOTSTRAP_SERVERS}...")
    try:
        producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: str(k).encode("utf-8") if k is not None else None
        )
        await producer.start()
        logger.info("✅ Kafka Producer started successfully")
        yield
    except Exception as e:
        logger.error(f"❌ Failed to start Kafka Producer: {e}")
        yield
    finally:
        if producer:
            await producer.stop()
            logger.info("🛑 Kafka Producer stopped")


app = FastAPI(title="Intelligent Metrics Server", lifespan=lifespan)

# 🔹 CORS — allow frontend to connect from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 🔹 Flexible Telemetry Model
class Telemetry(BaseModel):
    metadata: Dict[str, Any] = {}
    hardware: Dict[str, Any] = {}
    software: Dict[str, Any] = {}
    security: Dict[str, Any] = {}
    logs: Dict[str, Any] = {}


# 🔥 Kafka SEND FUNCTION
async def send_to_kafka(topic: str, key: str, value: dict):
    if producer is None:
        logger.error(f"❌ Kafka Producer NOT initialized. Failed to send to {topic}")
        raise HTTPException(status_code=503, detail="Kafka service unavailable")

    try:
        await producer.send_and_wait(
            topic=topic,
            key=key,
            value=value
        )
    except Exception as e:
        logger.error(f"❌ Kafka send failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to persist data")


# ─────────────────────────────────────────────────────────────────────────────
# WEBSOCKET GATEWAY
# ─────────────────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Frontend WebSocket connection endpoint.
    Each connected frontend tab registers here and receives real-time
    analysis updates broadcast from the analysis_service.
    """
    await websocket.accept()
    _ws_clients.add(websocket)
    client_host = websocket.client.host if websocket.client else "unknown"
    logger.info(f"🔌 WebSocket client connected: {client_host} (total: {len(_ws_clients)})")

    # Send all latest analysis data immediately on connect (catch-up)
    if _latest_analysis:
        try:
            await websocket.send_json({
                "type": "catch_up",
                "systems": list(_latest_analysis.values()),
                "timestamp": datetime.utcnow().isoformat(),
            })
        except Exception:
            pass

    try:
        while True:
            # Keep connection alive — wait for client messages (e.g. ping)
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass  # Ignore malformed client messages

    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket client disconnected: {client_host}")
    except Exception as e:
        logger.warning(f"WebSocket error for {client_host}: {e}")
    finally:
        _ws_clients.discard(websocket)
        logger.info(f"Active WebSocket clients: {len(_ws_clients)}")


async def _broadcast_to_clients(payload: dict):
    """
    Broadcast a JSON payload to all connected frontend WebSocket clients.
    Silently removes disconnected clients.
    """
    if not _ws_clients:
        return

    disconnected = set()
    message = {
        "type": "analysis_update",
        "data": payload,
        "timestamp": datetime.utcnow().isoformat(),
    }

    for client in _ws_clients.copy():
        try:
            await client.send_json(message)
        except Exception:
            disconnected.add(client)

    for client in disconnected:
        _ws_clients.discard(client)

    if disconnected:
        logger.info(f"Removed {len(disconnected)} stale WS client(s)")


# ─────────────────────────────────────────────────────────────────────────────
# ANALYSIS UPDATE ENDPOINT (called by analysis_service)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/analysis-update")
async def receive_analysis_update(payload: Dict[str, Any]):
    """
    Called by analysis_service to push analysis results.
    Stores result in memory and broadcasts to all WS clients.
    """
    system_id = payload.get("system_info", {}).get("system_id")
    if not system_id:
        raise HTTPException(status_code=400, detail="Missing system_info.system_id in payload")

    # Store latest result per system
    _latest_analysis[system_id] = payload
    logger.info(f"📡 Analysis update received for {system_id} — broadcasting to {len(_ws_clients)} clients")

    # Broadcast to all connected frontends
    await _broadcast_to_clients(payload)

    return {"status": "broadcast", "system_id": system_id, "clients_notified": len(_ws_clients)}


# ─────────────────────────────────────────────────────────────────────────────
# REST API ENDPOINTS FOR FRONTEND POLLING (fallback when WS unavailable)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/systems")
async def get_all_systems():
    """
    Returns all latest analysis results.
    Frontend can call this on initial load as a fallback.
    """
    return {
        "status": "ok",
        "systems": list(_latest_analysis.values()),
        "count": len(_latest_analysis),
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/diagnosis/{system_id}")
async def get_system_diagnosis(system_id: str):
    """
    Returns the latest analysis result for a specific system.
    """
    result = _latest_analysis.get(system_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No analysis data found for system: {system_id}"
        )
    return result


# ─────────────────────────────────────────────────────────────────────────────
# EXISTING ENDPOINTS — UNCHANGED
# ─────────────────────────────────────────────────────────────────────────────

# ✅ TELEMETRY ENDPOINT
@app.post("/telemetry")
async def receive_telemetry(data: Telemetry):
    try:
        system_id = data.metadata.get("system_id")

        if not system_id:
            raise HTTPException(status_code=400, detail="Missing system_id in metadata")

        timestamp = data.metadata.get("timestamp") or datetime.utcnow().isoformat()

        cpu = data.hardware.get("cpu", {}).get("usage_percent")
        ram = data.hardware.get("memory", {}).get("percent")

        logger.info(f"📊 Telemetry from {system_id} | CPU: {cpu}% | RAM: {ram}%")

        await send_to_kafka(
            topic=TELEMETRY_TOPIC,
            key=system_id,
            value={
                "system_id": system_id,
                "timestamp": timestamp,
                "type": "telemetry",
                "hardware": data.hardware,
                "software": data.software,
                "security": data.security,
                "logs": data.logs
            }
        )

        return {"status": "success", "message": "telemetry processed"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ unexpected error in telemetry endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ✅ HEARTBEAT ENDPOINT
@app.post("/heartbeat")
async def receive_heartbeat(data: Dict[str, Any]):
    try:
        system_id = data.get("system_id")

        if not system_id:
            raise HTTPException(status_code=400, detail="Missing system_id")

        logger.info(f"💓 Heartbeat received: {system_id}")

        await send_to_kafka(
            topic=HEARTBEAT_TOPIC,
            key=system_id,
            value={
                "system_id": system_id,
                "timestamp": datetime.utcnow().isoformat(),
                "type": "heartbeat",
                "data": data
            }
        )

        return {"status": "success", "message": "heartbeat acknowledged"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ unexpected error in heartbeat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ✅ HEALTH CHECK
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "kafka_connected": producer is not None,
        "websocket_clients": len(_ws_clients),
        "systems_tracked": len(_latest_analysis),
        "timestamp": datetime.utcnow().isoformat()
    }