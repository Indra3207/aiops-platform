import asyncio
from fastapi import FastAPI
from contextlib import asynccontextmanager

from kafka_client import KafkaClient
from processor import process_event
from config import KAFKA_BOOTSTRAP_SERVERS, INPUT_TOPIC, OUTPUT_TOPIC

kafka = KafkaClient(
    KAFKA_BOOTSTRAP_SERVERS,
    INPUT_TOPIC,
    OUTPUT_TOPIC
)

background_tasks = set()


async def run_feature_pipeline():
    print("Feature pipeline started...")
    async for event in kafka.consume():
        try:
            await process_event(event, kafka)
        except Exception as e:
            print("Pipeline error:", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup mechanics
    await kafka.start()
    task = asyncio.create_task(run_feature_pipeline())
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
    
    yield
    
    # Shutdown mechanics
    print("Shutting down Feature Aggregator...")
    task.cancel()
    await kafka.close()


app = FastAPI(title="Feature Aggregator Service", lifespan=lifespan)


@app.get("/")
def health():
    return {
        "status": "Feature Aggregator Running",
        "kafka_connected": kafka.connected
    }