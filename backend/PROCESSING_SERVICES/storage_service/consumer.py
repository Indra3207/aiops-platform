import asyncio
import json
import signal
from aiokafka import AIOKafkaConsumer

from config import KAFKA_BOOTSTRAP, KAFKA_TOPIC, CONSUMER_GROUP
from db import raw_collection, metrics_collection, check_db_connection
from processor import extract_metrics

# 🔹 Global event for graceful shutdown
shutdown_event = None

def handle_signal(sig, frame):
    print(f"\nReceived signal {sig}, shutting down...")
    if shutdown_event:
        shutdown_event.set()

async def consume():
    global shutdown_event
    shutdown_event = asyncio.Event()

    # 🔹 Verify DB Connection
    if not await check_db_connection():
        print("❌ Could not connect to MongoDB. Exiting...")
        return

    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        group_id=CONSUMER_GROUP,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        enable_auto_commit=True,
        auto_offset_reset="earliest"
    )

    try:
        await consumer.start()
        print("🚀 Storage Consumer Started...")
    except Exception as e:
        print(f"❌ Failed to start Kafka consumer: {e}")
        return

    try:
        while not shutdown_event.is_set():
            try:
                # Wait for messages with a timeout to check shutdown event
                res = await consumer.getmany(timeout_ms=1000)
                
                for tp, messages in res.items():
                    for msg in messages:
                        data = msg.value
                        
                        # 🔹 Store raw data
                        try:
                            await raw_collection.insert_one(data)
                        except Exception as e:
                            print(f"❌ Failed to store raw data: {e}")
                            continue

                        # 🔹 Process data
                        processed = extract_metrics(data)

                        if processed:
                            try:
                                await metrics_collection.insert_one(processed)
                                print(f"✅ Stored processed metrics for {processed.get('system_id')}")
                            except Exception as e:
                                print(f"❌ Failed to store processed metrics: {e}")
                        else:
                            print(f"⚠️ Skipping metrics storage due to processing error for {data.get('system_id')}")

            except Exception as e:
                # Standard error handling if the error is not during shutdown
                if not shutdown_event.is_set():
                    print(f"❌ Error in consumption loop: {e}")
                await asyncio.sleep(1)

    finally:
        print("🛑 Stopping consumer...")
        await consumer.stop()
        print("👋 Consumer stopped gracefully.")

if __name__ == "__main__":
    # 🔹 Set up signal handlers for graceful shutdown (SIGINT, SIGTERM)
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            signal.signal(sig, handle_signal)
        except Exception:
            pass # Windows might not support all signals

    # 🔹 Run the consumer
    try:
        asyncio.run(consume())
    except KeyboardInterrupt:
        pass # Handle Ctrl+C gracefully