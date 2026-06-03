"""
Analysis Service — Kafka Client (async, matches rest of pipeline)
Consumes from: analysis-stream  (Diagnosis Agent output)
Produces to:   ui-dashboard-stream  (Final merged response for frontend)
"""

import json
import logging
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from config import config

logger = logging.getLogger(__name__)


class AnalysisKafkaClient:
    def __init__(self):
        self.consumer: AIOKafkaConsumer = None
        self.producer: AIOKafkaProducer = None

    async def start(self):
        try:
            self.consumer = AIOKafkaConsumer(
                config.CONSUME_TOPIC,
                bootstrap_servers=config.KAFKA_BROKER,
                group_id=config.GROUP_ID,
                auto_offset_reset="latest",
                enable_auto_commit=True,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            )
            self.producer = AIOKafkaProducer(
                bootstrap_servers=config.KAFKA_BROKER,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            )
            await self.consumer.start()
            await self.producer.start()
            logger.info(
                f"Kafka ready — consuming: {config.CONSUME_TOPIC}, "
                f"producing: {config.PRODUCE_TOPIC}"
            )
        except Exception as e:
            logger.error(f"Kafka connection failed: {e}")
            self.consumer = None
            self.producer = None

    async def stop(self):
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()

    async def consume(self):
        """Async generator that yields deserialized diagnosis payloads."""
        if not self.consumer:
            logger.warning("Kafka consumer not initialized — yielding nothing.")
            return
        async for msg in self.consumer:
            yield msg.value

    async def produce(self, payload: dict):
        if not self.producer:
            logger.warning("Kafka producer not initialized — printing to console.")
            print(json.dumps(payload, indent=2))
            return
        try:
            await self.producer.send_and_wait(config.PRODUCE_TOPIC, value=payload)
            sys_id = payload.get("system_info", {}).get("system_id", "unknown")
            logger.info(f"Published analysis output for {sys_id} → {config.PRODUCE_TOPIC}")
        except Exception as e:
            logger.error(f"Kafka produce failed: {e}")
