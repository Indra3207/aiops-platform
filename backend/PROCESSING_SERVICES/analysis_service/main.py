#!/usr/bin/env python3
"""
Analysis Service — Entry Point

Async FastAPI app that:
  1. Consumes diagnosis events from Kafka (analysis-stream)
  2. Runs the full AI pipeline (RAG → LLM → validate → merge)
  3. Publishes final response to Kafka (ui-dashboard-stream)
  4. Pushes real-time updates to CentralServer WebSocket gateway

Run:
    cd backend/PROCESSING_SERVICES/analysis_service
    uvicorn main:app --host 0.0.0.0 --port 8002 --reload

Or directly (no hot reload):
    python main.py
"""

import asyncio
import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from kafka_client import AnalysisKafkaClient
from processor import AnalysisProcessor
from websocket_manager import ws_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Global instances (created once at startup) ────────────────────────────────
kafka_client = AnalysisKafkaClient()
processor = AnalysisProcessor()


# ── Background task: Kafka consumer loop ─────────────────────────────────────
async def consume_loop():
    """
    Continuously consume diagnosis events from Kafka and process each one.
    Runs as a background task for the lifetime of the service.
    """
    logger.info("Kafka consumer loop started — waiting for diagnosis events...")
    try:
        async for diagnosis_payload in kafka_client.consume():
            system_id = diagnosis_payload.get("system_id", "unknown")
            logger.info(f"Received diagnosis event for: {system_id}")
            try:
                final_response = await processor.process_diagnosis(diagnosis_payload)
                await kafka_client.produce(final_response)
            except Exception as e:
                logger.error(f"Error processing event for {system_id}: {e}", exc_info=True)
    except asyncio.CancelledError:
        logger.info("Consumer loop cancelled — shutting down.")
    except Exception as e:
        logger.error(f"Consumer loop crashed: {e}", exc_info=True)


# ── FastAPI lifespan (startup / shutdown) ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────
    logger.info("Analysis Service starting up...")

    await kafka_client.start()

    if kafka_client.consumer:
        consumer_task = asyncio.create_task(consume_loop())
        logger.info("Analysis Service running — consuming from Kafka.")
    else:
        consumer_task = None
        logger.warning(
            "Kafka not available. Service running in API-only mode. "
            "POST to /api/process to test manually."
        )

    yield  # Service is running

    # ── Shutdown ───────────────────────────────────────────────────────────
    logger.info("Analysis Service shutting down...")
    if consumer_task:
        consumer_task.cancel()
        try:
            await consumer_task
        except asyncio.CancelledError:
            pass
    await kafka_client.stop()
    await ws_manager.close()
    logger.info("Analysis Service stopped cleanly.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AIOps Analysis Service",
    description="RAG + LLM orchestration layer for AI-powered system diagnosis",
    version="1.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "analysis-service",
        "kafka_consumer": kafka_client.consumer is not None,
        "kafka_producer": kafka_client.producer is not None,
    }


@app.post("/api/process")
async def manual_process(diagnosis_payload: dict):
    """
    Manual trigger for testing without Kafka.
    POST a diagnosis_agent output payload here to run the full pipeline.
    """
    try:
        result = await processor.process_diagnosis(diagnosis_payload)
        return {"status": "success", "result": result}
    except Exception as e:
        logger.error(f"Manual process error: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


# ── Script entrypoint ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=False,
        log_level="info",
    )
