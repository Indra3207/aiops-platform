import json
import asyncio
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from aiokafka.errors import KafkaConnectionError

class KafkaClient:
    def __init__(self, bootstrap_servers, topic_in, topic_out):
        self.bootstrap_servers = bootstrap_servers
        self.topic_in = topic_in
        self.topic_out = topic_out
        self.consumer = None
        self.producer = None
        self.connected = False

    async def start(self):
        retries = 5
        for i in range(retries):
            try:
                self.consumer = AIOKafkaConsumer(
                    self.topic_in,
                    bootstrap_servers=self.bootstrap_servers,
                    group_id="feature-aggregator-group",
                    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                    auto_offset_reset="earliest"
                )
                self.producer = AIOKafkaProducer(
                    bootstrap_servers=self.bootstrap_servers
                )
                await self.consumer.start()
                await self.producer.start()
                self.connected = True
                print("Connected to Kafka successfully.")
                return
            except KafkaConnectionError as e:
                print(f"Kafka connection failed, retrying in 5s... ({i+1}/{retries}): {e}")
                await asyncio.sleep(5)
            except Exception as e:
                print(f"Unexpected error connecting to Kafka: {e}")
                await asyncio.sleep(5)
        print("Failed to connect to Kafka. System may not function properly until Kafka is up.")

    async def close(self):
        if self.connected:
            await self.consumer.stop()
            await self.producer.stop()
            self.connected = False
            print("Kafka client closed securely.")

    async def consume(self):
        if not self.connected:
            return
        try:
            async for msg in self.consumer:
                yield msg.value
        except Exception as e:
            print(f"Consumer encountered an error: {e}")

    async def produce(self, data):
        if not self.connected:
            return
        try:
            await self.producer.send_and_wait(
                self.topic_out,
                json.dumps(data).encode("utf-8")
            )
        except Exception as e:
            print(f"Producer failed to send data: {e}")