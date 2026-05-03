"""
Monitoring Service — Application Entry Point
===============================================
FastAPI app with modern lifespan management, structured logging,
graceful Kafka shutdown, and an observable health endpoint.
"""

import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI

from kafka_client import KafkaClient
from processor import process_event, get_stats
from config import (
    KAFKA_BOOTSTRAP_SERVERS,
    TELEMETRY_TOPIC,
    ALERT_TOPIC,
    LOG_LEVEL,
    DEBUG_MODE,
)

# ──────────────────────────── Logging Setup ───────────────────
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("monitoring.main")

# ──────────────────────────── Kafka Client ────────────────────
kafka = KafkaClient(
    KAFKA_BOOTSTRAP_SERVERS,
    TELEMETRY_TOPIC,
    ALERT_TOPIC,
)

# Background task handle (so we can cancel on shutdown)
_consume_task: asyncio.Task | None = None


# ──────────────────────────── Consumption Loop ────────────────
async def _run_consumer() -> None:
    """
    Main consumption loop.  Runs forever, processing one telemetry
    event at a time.  Errors in individual events are caught so the
    loop never dies silently.
    """
    logger.info("🚀 Monitoring consumer loop started")
    try:
        async for event in kafka.consume():
            try:
                sid = event.get("system_id", "???")
                logger.debug("Event received from %s", sid)
                await process_event(event, kafka)
            except Exception:
                logger.exception("Unhandled error processing event")
    except asyncio.CancelledError:
        logger.info("Consumer loop cancelled — shutting down")
    except Exception:
        logger.exception("Fatal error in consumer loop")


# ──────────────────────────── Lifespan ────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start Kafka on startup, tear down gracefully on shutdown."""
    global _consume_task

    logger.info("═" * 50)
    logger.info("  Monitoring Service starting …")
    logger.info("  Kafka broker : %s", KAFKA_BOOTSTRAP_SERVERS)
    logger.info("  Consume from : %s", TELEMETRY_TOPIC)
    logger.info("  Produce to   : %s", ALERT_TOPIC)
    logger.info("  Debug mode   : %s", DEBUG_MODE)
    logger.info("═" * 50)

    await kafka.start()
    _consume_task = asyncio.create_task(_run_consumer())

    yield  # ← app is running

    # Shutdown
    logger.info("Shutting down monitoring service …")
    if _consume_task and not _consume_task.done():
        _consume_task.cancel()
        try:
            await _consume_task
        except asyncio.CancelledError:
            pass

    await kafka.stop()
    logger.info("Monitoring service stopped.")


# ──────────────────────────── App ─────────────────────────────
app = FastAPI(
    title="Monitoring Service",
    description="Production-grade real-time telemetry monitoring agent",
    version="2.0.0",
    lifespan=lifespan,
)


@app.get("/")
def health():
    """Health / status endpoint with live stats."""
    stats = get_stats()
    return {
        "status": "Monitoring Agent Running",
        "version": "2.0.0",
        "stats": stats,
    }
