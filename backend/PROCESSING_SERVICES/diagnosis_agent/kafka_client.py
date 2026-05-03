import json
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer


class KafkaClient:
    def __init__(self, bootstrap_servers):
        self.consumer = AIOKafkaConsumer(
            "feature-stream",
            bootstrap_servers=bootstrap_servers,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            group_id="diagnosis-agent-group",
            auto_offset_reset="latest"
        )

        self.producer = AIOKafkaProducer(
            bootstrap_servers=bootstrap_servers
        )

    async def start(self):
        await self.consumer.start()
        await self.producer.start()

    async def consume(self):
        async for msg in self.consumer:
            yield msg.value

    async def produce(self, topic, data):
        await self.producer.send_and_wait(
            topic,
            json.dumps(data).encode("utf-8")
        )