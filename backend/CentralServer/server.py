import logging
import json
import os
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException
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
        # We still yield to allow the server to start, but producer will be None
        yield
    finally:
        if producer:
            await producer.stop()
            logger.info("🛑 Kafka Producer stopped")


app = FastAPI(title="Intelligent Metrics Server", lifespan=lifespan)


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


# ✅ TELEMETRY ENDPOINT
@app.post("/telemetry")
async def receive_telemetry(data: Telemetry):
    try:
        system_id = data.metadata.get("system_id")

        if not system_id:
            raise HTTPException(status_code=400, detail="Missing system_id in metadata")

        timestamp = data.metadata.get("timestamp") or datetime.utcnow().isoformat()

        # Log summary of received metrics
        cpu = data.hardware.get("cpu", {}).get("usage_percent")
        ram = data.hardware.get("memory", {}).get("percent")
        
        logger.info(f"📊 Telemetry from {system_id} | CPU: {cpu}% | RAM: {ram}%")

        # 🚀 Send to Kafka
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

        # 🚀 Send to Kafka
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
        "timestamp": datetime.utcnow().isoformat()
    }