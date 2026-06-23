import os

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "telemetry")  # Fixed: was "telemetry-stream" (topic mismatch bug)
CONSUMER_GROUP = os.getenv("CONSUMER_GROUP", "storage-group")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "metrics_db")