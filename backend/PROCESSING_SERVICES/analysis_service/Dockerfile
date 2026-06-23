FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Rag-Data from the backend directory (needed for KB + embeddings)
# This will be copied in docker-compose via a build context or volume mount
# For standalone build, RAG data is mounted as a volume
COPY . .

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
