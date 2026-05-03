"""
RAG Pipeline - Main Entry Point.

Usage:
    python main.py                 # Run with sample diagnosis input
    python main.py --ingest-only   # Only build the FAISS index, don't retrieve
"""

import json
import logging
import os
import sys
from typing import Optional

from rag.vector_store import VectorStore
from rag.retriever import Retriever, build_retrieval_query

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KB_PATH = os.path.join(BASE_DIR, "data", "kb_entries_all.json")
INDEX_DIR = os.path.join(BASE_DIR, "data", "index_cache")


# Sample diagnosis input - matches the exact schema from the Diagnosis Agent output_builder
SAMPLE_DIAGNOSIS = {
    "system_id": "SYS-001",
    "timestamp": 1775418109,
    "diagnosis": {
        "root_cause": "Disk saturation due to critical utilization",
        "primary_resource": "disk",
        "severity": "CRITICAL",
        "confidence": 0.9,
        "category": "resource_issue",
        "stage": "critical",
        "impact": [
            "Disk full condition may halt logging and crash applications",
            "Pagefile cannot expand under memory pressure",
            "New updates and backups will fail",
        ],
    },
    "signals": {
        "memory_pressure": True,
        "disk_saturation": True,
        "cpu_stress": False,
        "memory_leak": False,
    },
    "evidence": {
        "cpu": 48.2,
        "memory": 93.8,
        "disk": 99.1,
        "process": "MemCompression",
        # Extended evidence - pass through from feature aggregator when available
        "disk_fill_rate_mb_sec": 0.0,
    },
    "priority": 1,
    "meta": {
        "generated_at": 1775418109,
        "engine_version": "v1",
    },
}


def _init_store(verbose: bool = True) -> VectorStore:
    """
    Initialize the vector store. Loads from cache if available and KB unchanged.
    Falls back to fresh ingest + save.
    """
    store = VectorStore()

    if store.load_index(INDEX_DIR, kb_path=KB_PATH):
        if verbose:
            print(f"[Pipeline] Loaded {store.get_entry_count()} entries from index cache")
        return store

    if verbose:
        print("[Pipeline] Building index from KB (cache miss or KB changed)...")

    store.ingest(KB_PATH)
    store.save_index(INDEX_DIR, kb_path=KB_PATH)

    if verbose:
        print(f"[Pipeline] KB loaded: {store.get_entry_count()} entries indexed")

    return store


def run_pipeline(
    diagnosis_input: Optional[dict] = None,
    verbose: bool = True,
) -> dict:
    """
    Execute the full RAG retrieval pipeline.

    Args:
        diagnosis_input: Diagnosis agent output dict. Uses SAMPLE if None.
        verbose: Print detailed output.

    Returns:
        Retrieval result dict.
    """
    if diagnosis_input is None:
        diagnosis_input = SAMPLE_DIAGNOSIS

    # --- Step 1: Initialize Vector Store ---
    if verbose:
        print("=" * 70)
        print("  RAG RETRIEVAL PIPELINE")
        print("=" * 70)

    store = _init_store(verbose)

    # --- Step 2: Build Retriever ---
    retriever = Retriever(store)

    # --- Step 3: Show query construction ---
    query = build_retrieval_query(diagnosis_input)
    if verbose:
        print(f'\n[Pipeline] Primary query:\n  "{query}"\n')

    # --- Step 4: Execute retrieval ---
    result = retriever.retrieve(diagnosis_input, top_k=3)

    # --- Step 5: Display results ---
    if verbose:
        _print_results(result)

    return result


def _print_results(result: dict):
    """Pretty-print retrieval results to console."""
    print("=" * 70)
    print("  RETRIEVAL RESULTS")
    print("=" * 70)

    meta = result["metadata"]
    print(f"\n  Candidates fetched:  {meta['total_candidates']}")
    print(f"  After filter:        {meta['post_filter']}")
    print(f"  Resource filter:     {meta['primary_resource_filter']}")
    print(f"  Final results:       {meta['final_count']}")

    if result.get("secondary_queries"):
        print("\n  Secondary queries:")
        for sq in result["secondary_queries"]:
            print(f'    -> "{sq}"')

    for i, r in enumerate(result["results"], 1):
        print(f"\n{'=' * 60}")
        print(f"  RESULT #{i}")
        print(f"{'=' * 60}")
        print(f"  ID:             {r['id']}")
        print(f"  Title:          {r['title']}")
        print(f"  Score:          {r['score']}")
        print(f"  Resource:       {r['resource']}")
        print(f"  Scenario:       {r['scenario']}")
        print(f"  Root Cause:     {r['root_cause_type']}")
        print(f"  Severity:       {r['severity']}")
        print(f"\n  Explanation (first 200 chars):")
        print(f"    {r['explanation'][:200]}...")

        if r.get("confidence_factors"):
            print(f"\n  Confidence Factors:")
            for cf in r["confidence_factors"][:3]:
                print(f"    + {cf[:100]}")

        print(f"\n  Resolution steps: {len(r['resolution'])}")
        for step in r["resolution"][:3]:
            print(f"    * {step[:100]}")

        if r.get("causes"):
            print(f"\n  Possible Causes: {len(r['causes'])}")
            for cause in r["causes"][:3]:
                print(f"    - {cause[:100]}")

        if r["contradictions"]:
            print(f"\n  Contradictions ({len(r['contradictions'])}):")
            for c in r["contradictions"][:2]:
                print(f"    ! {c[:100]}")

        if r.get("related_patterns"):
            print(f"\n  Related: {', '.join(r['related_patterns'])}")


def main():
    if "--ingest-only" in sys.argv:
        print("[Pipeline] Ingest-only mode")
        store = VectorStore()
        store.ingest(KB_PATH)
        store.save_index(INDEX_DIR, kb_path=KB_PATH)
        print(f"[Pipeline] Done. {store.get_entry_count()} entries indexed and cached.")
        return

    result = run_pipeline()

    # Save result to file for downstream LLM consumption
    output_path = os.path.join(BASE_DIR, "data", "retrieval_output.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"\n[Pipeline] Results saved to: {output_path}")


if __name__ == "__main__":
    main()