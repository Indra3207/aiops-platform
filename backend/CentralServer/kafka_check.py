import asyncio
import json
import os
from aiokafka import AIOKafkaProducer

async def check():
    bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    print(f"Checking connection to Kafka at {bootstrap_servers}...")
    
    producer = AIOKafkaProducer(
        bootstrap_servers=bootstrap_servers,
        value_serializer=lambda v: json.dumps(v).encode("utf-8")
    )
    try:
        await producer.start()
        print("✅ SUCCESS: Kafka is reachable and Producer started")
        await producer.stop()
        return True
    except Exception as e:
        print(f"❌ FAILURE: Kafka connection failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(check())
