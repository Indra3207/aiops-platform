import asyncio
from aiokafka import AIOKafkaConsumer

async def test():
    try:
        c = AIOKafkaConsumer("test-topic", bootstrap_servers="localhost:9092")
        await c.start()
        print("Consumer started successfully without group_id.")
        await c.stop()
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    asyncio.run(test())
