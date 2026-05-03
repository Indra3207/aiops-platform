"""
FAISS Vector Store for RAG Retrieval Layer.

DESIGN DECISIONS:
- IndexFlatIP (Inner Product) on normalized vectors = cosine similarity
  (NOT IndexFlatL2 - L2 on unnormalized vectors gives wrong rankings)
- Stores metadata alongside vectors for post-retrieval filtering
- Supports serialization for production warm-start
- KB hash check ensures cache invalidation when KB changes
"""

import hashlib
import json
import logging
import os
import numpy as np
import faiss

from rag.embedder import embed_batch, EMBEDDING_DIM

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self):
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)
        self.entries = []       # Parallel array: entries[i] corresponds to vector i
        self._entry_map = {}    # id -> index for O(1) lookup by KB entry id

    def ingest(self, kb_path: str):
        """
        Load KB JSON and build the FAISS index.
        Validates schema compliance before indexing.
        """
        if not os.path.exists(kb_path):
            raise FileNotFoundError(f"KB file not found: {kb_path}")

        with open(kb_path, "r", encoding="utf-8") as f:
            raw_entries = json.load(f)

        if not isinstance(raw_entries, list) or len(raw_entries) == 0:
            raise ValueError("KB file must contain a non-empty JSON array")

        # Validate required fields
        required_fields = [
            "id", "embedding_text", "metadata", "scenario", "root_cause_type"
        ]
        seen_ids = set()
        for i, entry in enumerate(raw_entries):
            missing = [fld for fld in required_fields if fld not in entry]
            if missing:
                raise ValueError(
                    f"KB entry index {i} (id={entry.get('id', 'UNKNOWN')}) "
                    f"missing required fields: {missing}"
                )
            if "resource" not in entry.get("metadata", {}):
                raise ValueError(
                    f"KB entry {entry['id']} missing metadata.resource field"
                )
            # Check for duplicate IDs
            eid = entry["id"]
            if eid in seen_ids:
                raise ValueError(f"Duplicate KB entry ID: {eid}")
            seen_ids.add(eid)

        # Extract embedding texts
        embedding_texts = [entry["embedding_text"] for entry in raw_entries]

        # Batch embed all KB entries
        logger.info(f"Embedding {len(embedding_texts)} KB entries...")
        print(f"[VectorStore] Embedding {len(embedding_texts)} KB entries...")
        vectors = embed_batch(embedding_texts)

        # Build FAISS index
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)
        self.index.add(vectors)
        self.entries = raw_entries
        self._entry_map = {entry["id"]: i for i, entry in enumerate(raw_entries)}

        print(f"[VectorStore] Indexed {self.index.ntotal} vectors successfully")

    def search(self, query_vector: np.ndarray, top_k: int = 10) -> list:
        """
        Search FAISS index and return top_k results with scores.

        Returns:
            List of (score, entry) tuples, sorted by descending similarity
        """
        if self.index.ntotal == 0:
            raise RuntimeError("Vector store is empty. Call ingest() first.")

        if query_vector.ndim == 1:
            query_vector = query_vector.reshape(1, -1)

        effective_k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query_vector, effective_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append((float(score), self.entries[idx]))

        return results

    def get_entry_by_id(self, entry_id: str) -> dict:
        """
        O(1) lookup of a KB entry by its ID.
        Used for related_patterns graph traversal.

        Returns:
            The KB entry dict, or None if not found.
        """
        idx = self._entry_map.get(entry_id)
        if idx is not None:
            return self.entries[idx]
        return None

    def save_index(self, index_dir: str, kb_path: str = None):
        """
        Save FAISS index, entries, and KB hash to disk for warm-start.
        """
        os.makedirs(index_dir, exist_ok=True)
        faiss.write_index(self.index, os.path.join(index_dir, "faiss.index"))
        with open(os.path.join(index_dir, "entries.json"), "w", encoding="utf-8") as f:
            json.dump(self.entries, f, ensure_ascii=True)

        # Save KB hash so we can detect when KB changes
        if kb_path and os.path.exists(kb_path):
            kb_hash = self._hash_file(kb_path)
            with open(os.path.join(index_dir, "kb_hash.txt"), "w") as f:
                f.write(kb_hash)

        print(f"[VectorStore] Index saved to {index_dir}")

    def load_index(self, index_dir: str, kb_path: str = None) -> bool:
        """
        Load FAISS index and entries from disk.
        If kb_path is provided, validates that the KB hasn't changed since
        the index was built (hash check). If it changed, returns False
        to force a re-ingest.

        Returns:
            True if loaded successfully, False if cache invalid or missing
        """
        index_path = os.path.join(index_dir, "faiss.index")
        entries_path = os.path.join(index_dir, "entries.json")

        if not os.path.exists(index_path) or not os.path.exists(entries_path):
            return False

        # Check KB hash - invalidate cache if KB was modified
        if kb_path and os.path.exists(kb_path):
            hash_path = os.path.join(index_dir, "kb_hash.txt")
            if os.path.exists(hash_path):
                with open(hash_path, "r") as f:
                    cached_hash = f.read().strip()
                current_hash = self._hash_file(kb_path)
                if cached_hash != current_hash:
                    print("[VectorStore] KB file changed since last index build. Re-indexing required.")
                    return False

        self.index = faiss.read_index(index_path)
        with open(entries_path, "r", encoding="utf-8") as f:
            self.entries = json.load(f)

        if self.index.ntotal != len(self.entries):
            print("[VectorStore] WARNING: Index/entries count mismatch. Re-ingest required.")
            return False

        self._entry_map = {entry["id"]: i for i, entry in enumerate(self.entries)}
        print(f"[VectorStore] Loaded {self.index.ntotal} vectors from cache")
        return True

    def get_entry_count(self) -> int:
        """Return the number of indexed entries."""
        return self.index.ntotal

    @staticmethod
    def _hash_file(filepath: str) -> str:
        """Compute MD5 hash of a file for change detection."""
        h = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()