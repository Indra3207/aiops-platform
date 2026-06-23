FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Storage service has no HTTP server — it's a pure Kafka consumer
CMD ["python", "consumer.py"]
