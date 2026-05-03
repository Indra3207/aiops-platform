import os

class Config:
    # Kafka
    KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
    CONSUME_TOPIC = os.getenv("CONSUME_TOPIC", "analysis-stream")
    PRODUCE_TOPIC = os.getenv("PRODUCE_TOPIC", "ui-dashboard-stream")
    GROUP_ID = os.getenv("GROUP_ID", "analysis-service-group")

    # Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    # Assuming Rag-Data is adjacent to Important folder on Desktop
    # c:\Users\indra\OneDrive\Desktop\Important... -> Desktop\Rag-Data
    DESKTOP_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "..", ".."))
    RAG_DATA_DIR = os.path.join(DESKTOP_DIR, "Rag-Data")
    KB_PATH = os.path.join(RAG_DATA_DIR, "data", "kb_entries_all.json")
    INDEX_DIR = os.path.join(RAG_DATA_DIR, "data", "index_cache")

    # LLM Auth
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")

config = Config()
