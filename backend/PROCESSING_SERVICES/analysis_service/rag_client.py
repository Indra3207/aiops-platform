"""
Analysis Service — RAG Client

Bridges analysis_service with the existing Rag-Data pipeline.
Uses absolute path injection so the RAG modules resolve correctly
regardless of which directory the service is run from.
"""

import sys
import logging
from config import config

logger = logging.getLogger(__name__)

# ── Inject Rag-Data root onto sys.path so `from rag.xxx import` works ─────────
if config.RAG_DATA_DIR not in sys.path:
    sys.path.insert(0, config.RAG_DATA_DIR)
    logger.info(f"Added RAG path to sys.path: {config.RAG_DATA_DIR}")

try:
    from rag.vector_store import VectorStore
    from rag.retriever import Retriever
except ImportError as e:
    logger.error(
        f"Failed to import RAG modules from: {config.RAG_DATA_DIR}\n"
        f"Verify that this path contains a 'rag/' package with vector_store.py and retriever.py\n"
        f"Error: {e}"
    )
    raise


class RAGClient:
    def __init__(self):
        logger.info(f"Initializing FAISS Vector Store from: {config.KB_PATH}")
        self.store = VectorStore()

        # Load from warm-start cache if KB unchanged, otherwise re-ingest
        loaded = self.store.load_index(config.INDEX_DIR, kb_path=config.KB_PATH)
        if not loaded:
            logger.info("No cached index found or KB changed — rebuilding index...")
            self.store.ingest(config.KB_PATH)
            self.store.save_index(config.INDEX_DIR, kb_path=config.KB_PATH)

        logger.info(f"RAG Client ready — {self.store.get_entry_count()} entries indexed.")
        self.retriever = Retriever(self.store)

    def retrieve(self, diagnosis_payload: dict, top_k: int = 3) -> dict:
        """
        Run the full retrieval pipeline for a given diagnosis payload.
        Returns dict with 'results', 'query', 'metadata'.
        """
        system_id = diagnosis_payload.get("system_id", "unknown")
        logger.info(f"RAG retrieval for: {system_id}")
        try:
            return self.retriever.retrieve(diagnosis_payload, top_k=top_k)
        except Exception as e:
            logger.error(f"RAG retrieval failed for {system_id}: {e}")
            return {"results": [], "query": "", "metadata": {}, "error": str(e)}
