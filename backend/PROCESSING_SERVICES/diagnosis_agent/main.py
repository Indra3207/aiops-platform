import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI

from kafka_client import KafkaClient
from processor import process_event
from config import *

kafka = KafkaClient(KAFKA_BOOTSTRAP_SERVERS)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await kafka.start()
    task = asyncio.create_task(run())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    if hasattr(kafka, 'stop'):
        await kafka.stop()
    else:
        if hasattr(kafka, 'consumer'):
            await kafka.consumer.stop()
        if hasattr(kafka, 'producer'):
            await kafka.producer.stop()

app = FastAPI(lifespan=lifespan)

async def run():
    try:
        async for event in kafka.consume():
            event_id = event.get("system_id", "unknown") + str(event.get("timestamp", ""))
            print(f"--- START PROCESSING EVENT: {event_id} ---")
            try:
                await process_event(event, kafka)
            except Exception as e:
                print("Error:", e)
            print(f"--- END PROCESSING EVENT: {event_id} ---\n")
    except asyncio.CancelledError:
        pass

@app.get("/")
def health():
    return {"status": "Diagnosis Agent Running"}