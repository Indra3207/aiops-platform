"""
Monitoring Service — Kafka Client
===================================
Async Kafka consumer + producer with graceful lifecycle management,
structured logging, and error handling.
"""

import json
import logging

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

logger = logging.getLogger("monitoring.kafka")


class KafkaClient:
    """Thin async wrapper around aiokafka consumer and producer."""

    def __init__(self, bootstrap_servers: str,
                 topic_in: str, topic_out: str):
        self._bootstrap = bootstrap_servers
        self._topic_in = topic_in
        self._topic_out = topic_out

        self.consumer = None
        self.producer = None

    # ── Lifecycle ─────────────────────────────────────────────

    async def start(self) -> None:
        """Start both consumer and producer connections."""
        logger.info("Connecting to Kafka at %s …", self._bootstrap)

        self.consumer = AIOKafkaConsumer(
            self._topic_in,
            bootstrap_servers=self._bootstrap,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            enable_auto_commit=True,
            auto_offset_reset="earliest",
        )

        self.producer = AIOKafkaProducer(
            bootstrap_servers=self._bootstrap,
        )

        await self.consumer.start()
        logger.info("Consumer started — subscribed to '%s'", self._topic_in)
        await self.producer.start()
        logger.info("Producer started — target topic '%s'", self._topic_out)

    async def stop(self) -> None:
        """Gracefully close consumer and producer."""
        logger.info("Shutting down Kafka connections …")
        try:
            await self.consumer.stop()
            logger.info("Consumer stopped")
        except Exception:
            logger.exception("Error stopping consumer")

        try:
            await self.producer.stop()
            logger.info("Producer stopped")
        except Exception:
            logger.exception("Error stopping producer")

    # ── I/O ───────────────────────────────────────────────────

    async def consume(self):
        """Yield deserialized messages from the consumer topic."""
        async for msg in self.consumer:
            yield msg.value

    async def produce(self, data: dict) -> None:
        """Serialize and send *data* to the output topic."""
        payload = json.dumps(data).encode("utf-8")
        await self.producer.send_and_wait(self._topic_out, payload)
        logger.debug("Produced message to '%s' (%d bytes)",
                      self._topic_out, len(payload))