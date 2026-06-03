import os

class Config:
    # ── Kafka ──────────────────────────────────────────────────────────────
    KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
    CONSUME_TOPIC = os.getenv("CONSUME_TOPIC", "analysis-stream")
    PRODUCE_TOPIC = os.getenv("PRODUCE_TOPIC", "ui-dashboard-stream")
    GROUP_ID = os.getenv("GROUP_ID", "analysis-service-group")

    # ── Paths ──────────────────────────────────────────────────────────────
    # analysis_service/ → PROCESSING_SERVICES/ → backend/ → Important/
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BACKEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))
    RAG_DATA_DIR = os.path.join(BACKEND_DIR, "Rag-Data")
    KB_PATH = os.path.join(RAG_DATA_DIR, "data", "kb_entries_all.json")
    INDEX_DIR = os.path.join(RAG_DATA_DIR, "data", "index_cache")

    # ── OpenAI ─────────────────────────────────────────────────────────────
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")
    LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "30"))
    LLM_MAX_RETRIES = int(os.getenv("LLM_MAX_RETRIES", "1"))

    # ── Cache ──────────────────────────────────────────────────────────────
    CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "300"))  # 5 min

    # ── CentralServer WebSocket gateway ────────────────────────────────────
    CENTRAL_SERVER_URL = os.getenv("CENTRAL_SERVER_URL", "http://localhost:8000")
    CENTRAL_SERVER_WS_PUSH_ENDPOINT = os.getenv(
        "CENTRAL_SERVER_WS_PUSH_ENDPOINT", "http://localhost:8000/api/analysis-update"
    )

config = Config()
