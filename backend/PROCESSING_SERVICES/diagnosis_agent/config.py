import os

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

FEATURE_TOPIC = os.getenv("FEATURE_TOPIC", "feature-stream")
ALERT_TOPIC = os.getenv("ALERT_TOPIC", "alerts-stream")
OUTPUT_TOPIC = os.getenv("OUTPUT_TOPIC", "analysis-stream")