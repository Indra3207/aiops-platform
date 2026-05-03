import sys
import logging
from .config import config

logger = logging.getLogger(__name__)

# Add Rag-Data to PYTHONPATH so we can import from it
if config.RAG_DATA_DIR not in sys.path:
    sys.path.append(config.RAG_DATA_DIR)

try:
    from rag.vector_store import VectorStore
    from rag.retriever import Retriever
except ImportError as e:
    logger.error(f"Failed to import RAG modules from {config.RAG_DATA_DIR}. Is the path correct?")
    raise e

class RAGClient:
    def __init__(self):
        self.store = VectorStore()
        logger.info("Initializing FAISS Vector Store...")
        
        # Load from cache or build from scratch
        if not self.store.load_index(config.INDEX_DIR, kb_path=config.KB_PATH):
            logger.info("No cached index found or KB changed. Building index...")
            self.store.ingest(config.KB_PATH)
            self.store.save_index(config.INDEX_DIR, kb_path=config.KB_PATH)
            
        logger.info(f"RAG Client ready. {self.store.get_entry_count()} entries loaded.")
        self.retriever = Retriever(self.store)

    def retrieve(self, diagnosis_payload: dict, top_k: int = 3) -> dict:
        """
        Retrieves top-k context using the deterministic Retriever pipeline
        """
        logger.info(f"Retrieving context for system: {diagnosis_payload.get('system_id')}")
        return self.retriever.retrieve(diagnosis_payload, top_k=top_k)
