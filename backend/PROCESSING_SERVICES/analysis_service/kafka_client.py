import json
import logging
from kafka import KafkaConsumer, KafkaProducer
from .config import config

logger = logging.getLogger(__name__)

class AnalysisKafkaClient:
    def __init__(self):
        try:
            self.consumer = KafkaConsumer(
                config.CONSUME_TOPIC,
                bootstrap_servers=[config.KAFKA_BROKER],
                group_id=config.GROUP_ID,
                auto_offset_reset='latest',
                enable_auto_commit=True,
                value_deserializer=lambda x: json.loads(x.decode('utf-8'))
            )
            
            self.producer = KafkaProducer(
                bootstrap_servers=[config.KAFKA_BROKER],
                value_serializer=lambda x: json.dumps(x).encode('utf-8')
            )
            
            logger.info(f"Kafka initialized. Consuming from {config.CONSUME_TOPIC}, Producing to {config.PRODUCE_TOPIC}")
        except Exception as e:
            logger.error(f"Kafka connection failed. Ensure broker {config.KAFKA_BROKER} is running.")
            # Do not throw, allow graceful degradation if developing locally without kafka
            self.consumer = None
            self.producer = None

    def consume(self):
        if not self.consumer:
            logger.warning("Consumer not initialized. Yielding empty.")
            return []
            
        return self.consumer

    def produce(self, payload: dict):
        if not self.producer:
            logger.warning("Producer not initialized. Printing to console instead.")
            print(json.dumps(payload, indent=2))
            return
            
        try:
            self.producer.send(config.PRODUCE_TOPIC, value=payload)
            self.producer.flush()
            logger.info(f"Successfully published Analysis output for {payload.get('system_info', {}).get('system_id')} to {config.PRODUCE_TOPIC}")
        except Exception as e:
            logger.error(f"Failed to produce message: {e}")
