import os

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
INPUT_TOPIC = os.getenv("INPUT_TOPIC", "telemetry")
OUTPUT_TOPIC = os.getenv("OUTPUT_TOPIC", "feature-stream")

WINDOW_SIZE = int(os.getenv("WINDOW_SIZE", "5"))