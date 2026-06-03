"""
Analysis Service — Cache Manager

Lightweight in-memory cache to prevent duplicate OpenAI calls
for the same diagnosis event.

Cache Key: (system_id, diagnosis_hash)
  - diagnosis_hash is MD5 of the 'diagnosis' sub-dict
  - This means: same system + same root_cause/severity = cache hit

TTL: configurable via CACHE_TTL_SECONDS env var (default: 300s = 5 min)
"""

import hashlib
import json
import logging
import time
from typing import Optional

from config import config

logger = logging.getLogger(__name__)


class CacheManager:
    def __init__(self, ttl_seconds: int = None):
        self._store: dict[str, tuple[dict, float]] = {}  # key -> (value, expires_at)
        self._ttl = ttl_seconds if ttl_seconds is not None else config.CACHE_TTL_SECONDS

    # ── Internal helpers ───────────────────────────────────────────────────

    @staticmethod
    def _make_key(system_id: str, diagnosis_dict: dict) -> str:
        """
        Build a cache key from system_id + hash of diagnosis dict.
        Only hashes 'diagnosis' sub-dict (root_cause, severity, stage) —
        not the entire payload — to maximize cache hits across minor differences.
        """
        hash_input = json.dumps(diagnosis_dict, sort_keys=True, default=str)
        diagnosis_hash = hashlib.md5(hash_input.encode()).hexdigest()[:12]
        return f"{system_id}:{diagnosis_hash}"

    def _is_expired(self, expires_at: float) -> bool:
        return time.monotonic() > expires_at

    # ── Public API ─────────────────────────────────────────────────────────

    def get(self, system_id: str, diagnosis_payload: dict) -> Optional[dict]:
        """
        Retrieve cached analysis result.
        Returns None on cache miss or expiry.
        """
        diagnosis_sub = diagnosis_payload.get("diagnosis", {})
        key = self._make_key(system_id, diagnosis_sub)

        entry = self._store.get(key)
        if entry is None:
            return None

        value, expires_at = entry
        if self._is_expired(expires_at):
            logger.debug(f"Cache expired for key: {key}")
            del self._store[key]
            return None

        logger.info(f"Cache HIT for {system_id} (key: {key})")
        return value

    def set(self, system_id: str, diagnosis_payload: dict, result: dict):
        """Store analysis result in cache with TTL."""
        diagnosis_sub = diagnosis_payload.get("diagnosis", {})
        key = self._make_key(system_id, diagnosis_sub)
        expires_at = time.monotonic() + self._ttl
        self._store[key] = (result, expires_at)
        logger.info(f"Cache SET for {system_id} (key: {key}, TTL: {self._ttl}s)")

    def clear_expired(self):
        """Remove all expired entries. Call periodically if memory is a concern."""
        now = time.monotonic()
        expired_keys = [k for k, (_, exp) in self._store.items() if now > exp]
        for k in expired_keys:
            del self._store[k]
        if expired_keys:
            logger.debug(f"Cleared {len(expired_keys)} expired cache entries.")

    @property
    def size(self) -> int:
        return len(self._store)


# Module-level singleton
cache = CacheManager()
