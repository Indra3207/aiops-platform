"""
Embedding Engine for RAG Retrieval Layer.
Uses sentence-transformers (all-MiniLM-L6-v2) for semantic embedding.

DESIGN DECISIONS:
- Singleton model loading to prevent OOM on repeated imports
- Batch embedding for KB ingestion performance
- Normalized embeddings for consistent cosine similarity via Inner Product
"""

import logging
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

_MODEL_INSTANCE = None
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


def _get_model() -> SentenceTransformer:
    """Lazy singleton model loader. Prevents re-downloading/re-loading on every call."""
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is None:
        logger.info(f"Loading embedding model: {MODEL_NAME}")
        try:
            _MODEL_INSTANCE = SentenceTransformer(MODEL_NAME)
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise RuntimeError(
                f"Cannot load embedding model '{MODEL_NAME}'. "
                f"Ensure sentence-transformers is installed and the model is accessible. "
                f"Original error: {e}"
            ) from e
    return _MODEL_INSTANCE


def embed_text(text: str) -> np.ndarray:
    """
    Embed a single text string. Returns a 1D float32 numpy array of shape (384,).
    Used for query embedding at retrieval time.
    """
    if not text or not text.strip():
        raise ValueError("Cannot embed empty or whitespace-only text")
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True, show_progress_bar=False)
    return np.array(embedding, dtype=np.float32)


def embed_batch(texts: list) -> np.ndarray:
    """
    Embed a batch of texts. Returns a 2D float32 numpy array of shape (N, 384).
    Used for KB ingestion - embeds all embedding_text fields at once.
    """
    if not texts:
        raise ValueError("Cannot embed empty text list")
    valid_texts = [t for t in texts if t and t.strip()]
    if len(valid_texts) != len(texts):
        raise ValueError(
            f"Found {len(texts) - len(valid_texts)} empty embedding_text entries in KB. "
            "All KB entries MUST have non-empty embedding_text."
        )
    model = _get_model()
    embeddings = model.encode(
        valid_texts,
        normalize_embeddings=True,
        show_progress_bar=True,
        batch_size=32,
    )
    return np.array(embeddings, dtype=np.float32)