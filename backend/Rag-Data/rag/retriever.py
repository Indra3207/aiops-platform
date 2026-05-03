"""
RAG Retriever - Core Retrieval Engine.

Takes diagnosis output from the Diagnosis Agent and retrieves
the most relevant KB entries from the FAISS vector store.

PIPELINE:
1. Build structured query from diagnosis output
2. Embed query
3. Search FAISS (over-fetch candidates)
4. Apply metadata filters (cascading)
5. Apply signal-aware re-ranking
6. Expand via related_patterns graph traversal
7. Check contradictions with real signal matching
8. Return top_k results with confidence scores
"""

import logging
import re
from typing import Optional

from rag.embedder import embed_text
from rag.vector_store import VectorStore

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# 1. QUERY BUILDER - aligned with KB embedding_text patterns
# ------------------------------------------------------------------

def build_retrieval_query(diagnosis_output: dict) -> str:
    """
    Build a semantically-rich query string aligned with KB embedding_text patterns.

    The KB embedding_text fields follow a consistent pattern:
      "Windows {resource} {condition} {metric_details} {process_info} {signal_descriptors}"

    This query builder mirrors that pattern using all available diagnosis fields.
    """
    diag = diagnosis_output.get("diagnosis", {})
    signals = diagnosis_output.get("signals", {})
    evidence = diagnosis_output.get("evidence", {})

    root_cause = diag.get("root_cause", "")
    severity = diag.get("severity", "")

    cpu_val = evidence.get("cpu", 0)
    mem_val = evidence.get("memory", 0)
    disk_val = evidence.get("disk", 0)
    process = evidence.get("process", "unknown")

    # --- Metric context (mirrors KB language: "above 95%", "at 85%") ---
    metric_parts = []
    if cpu_val > 60:
        metric_parts.append(f"CPU above {int(cpu_val)}%")
    elif cpu_val > 40:
        metric_parts.append(f"CPU at {int(cpu_val)}%")

    if mem_val > 85:
        metric_parts.append(f"memory above {int(mem_val)}%")
    elif mem_val > 70:
        metric_parts.append(f"memory at {int(mem_val)}%")

    if disk_val > 95:
        metric_parts.append(f"disk above {int(disk_val)}%")
    elif disk_val > 85:
        metric_parts.append(f"disk at {int(disk_val)}%")

    # --- Signal text from boolean signals ---
    # Maps BOTH the collapsed signal names from output_builder AND
    # the original resource/behavioral/process signal names from signal_engine
    signal_parts = []
    signal_mapping = {
        # From output_builder collapsed signals
        "memory_pressure": "memory pressure",
        "disk_saturation": "disk saturation",
        "disk_pressure": "disk pressure high utilization",
        "cpu_stress": "CPU stress elevated",
        "cpu_saturation": "sustained CPU exhaustion",
        "memory_leak": "memory leak pattern detected",
        "process_bottleneck": "process bottleneck resource exhaustion",
        "dominant_process_heavy": "dominant process high CPU share",
        # Additional flags the diagnosis agent may pass
        "cpu_spike": "CPU spike transient",
        "cpu_sustained_high": "sustained high CPU",
        "disk_risk": "disk risk flagged",
        "memory_risk": "memory risk flagged",
        "cascade_risk": "cascading failure multi-resource",
    }
    for signal_key, signal_text in signal_mapping.items():
        if signals.get(signal_key, False):
            signal_parts.append(signal_text)

    # --- Process context ---
    process_text = ""
    if process and process not in ("unknown", "idle", "System Idle Process"):
        process_text = f"with {process} process dominant"

    # --- Fill rate context (if available from extended evidence) ---
    fill_rate_text = ""
    fill_rate = evidence.get("disk_fill_rate_mb_sec", 0)
    if fill_rate > 5:
        fill_rate_text = "rapid fill rate above 5 MB/s"
    elif fill_rate > 0.5:
        fill_rate_text = "sustained positive fill rate"
    elif fill_rate > 0:
        fill_rate_text = "slow sustained fill rate"

    # --- Severity context ---
    severity_text = ""
    if severity == "CRITICAL":
        severity_text = "critical severity"
    elif severity == "HIGH":
        severity_text = "high severity"

    # --- Assemble ---
    query_components = ["Windows", root_cause]

    if metric_parts:
        query_components.append(" ".join(metric_parts))
    if fill_rate_text:
        query_components.append(fill_rate_text)
    if signal_parts:
        query_components.append(" ".join(signal_parts))
    if process_text:
        query_components.append(process_text)
    if severity_text:
        query_components.append(severity_text)

    query = " ".join(filter(None, query_components))
    query = re.sub(r"\s+", " ", query).strip()
    return query


def build_secondary_queries(diagnosis_output: dict) -> list:
    """
    Build additional targeted query variations to catch KB entries that
    the primary query might miss due to embedding space coverage gaps.
    """
    diag = diagnosis_output.get("diagnosis", {})
    evidence = diagnosis_output.get("evidence", {})
    signals = diagnosis_output.get("signals", {})

    queries = []

    # Query 2: Process-focused (matches KB entries indexed by process name)
    process = evidence.get("process", "")
    if process and process not in ("unknown", "idle", "System Idle Process"):
        resource = diag.get("primary_resource", "")
        q = f"Windows {process} {resource} high"
        if signals.get("memory_leak"):
            q += " memory leak"
        if signals.get("cpu_stress") or signals.get("cpu_spike") or signals.get("cpu_saturation"):
            q += " CPU sustained"
        if signals.get("disk_saturation") or signals.get("disk_pressure"):
            q += " disk saturation"
        queries.append(q)

    # Query 3: Cascade/multi-resource detection
    active_resources = []
    if evidence.get("cpu", 0) > 50:
        active_resources.append("CPU")
    if evidence.get("memory", 0) > 80:
        active_resources.append("memory")
    if evidence.get("disk", 0) > 90:
        active_resources.append("disk")

    if len(active_resources) >= 2:
        queries.append(
            f"Windows cascading failure {' '.join(active_resources)} "
            "multi-resource pressure all resources distressed"
        )

    return queries


# ------------------------------------------------------------------
# 2. RETRIEVAL ENGINE
# ------------------------------------------------------------------

class Retriever:
    def __init__(self, vector_store: VectorStore):
        self.store = vector_store

    def retrieve(self, diagnosis_output: dict, top_k: int = 3) -> dict:
        """
        Full retrieval pipeline:
        1. Build query(s) from diagnosis output
        2. Embed and search FAISS (over-fetch)
        3. Filter by metadata.resource (cascading)
        4. Signal-aware re-ranking
        5. Graph expansion via related_patterns
        6. Return top_k results
        """
        # Step 1: Build queries
        primary_query = build_retrieval_query(diagnosis_output)
        secondary_queries = build_secondary_queries(diagnosis_output)

        # Step 2: Embed and search - primary query (over-fetch 3x)
        primary_vector = embed_text(primary_query)
        candidates_raw = self.store.search(primary_vector, top_k=top_k * 4)

        # Step 2b: Secondary queries - merge unique candidates
        seen_ids = {entry["id"] for _, entry in candidates_raw}
        for sq in secondary_queries:
            sq_vector = embed_text(sq)
            sq_results = self.store.search(sq_vector, top_k=top_k * 2)
            for score, entry in sq_results:
                if entry["id"] not in seen_ids:
                    candidates_raw.append((score * 0.9, entry))
                    seen_ids.add(entry["id"])

        # Step 3: Metadata Resource Filter (cascading)
        primary_resource = diagnosis_output.get("diagnosis", {}).get(
            "primary_resource", "unknown"
        )
        filtered = self._filter_by_resource(candidates_raw, primary_resource, top_k)

        # Step 4: Signal-aware re-ranking with contradiction checking
        ranked = self._rerank(filtered, diagnosis_output)

        # Step 5: Graph expansion - add related entries not already present
        ranked = self._expand_related(ranked, top_k)

        # Step 6: Final cut
        final_results = ranked[:top_k]

        return {
            "query": primary_query,
            "secondary_queries": secondary_queries,
            "results": [
                self._format_result(score, entry)
                for score, entry in final_results
            ],
            "metadata": {
                "total_candidates": len(candidates_raw),
                "post_filter": len(filtered),
                "primary_resource_filter": primary_resource,
                "final_count": len(final_results),
            },
        }

    def _format_result(self, score: float, entry: dict) -> dict:
        """Format a single KB entry for output."""
        return {
            "id": entry["id"],
            "title": entry.get("title", ""),
            "score": round(score, 4),
            "resource": entry.get("metadata", {}).get("resource", "unknown"),
            "scenario": entry.get("scenario", "unknown"),
            "root_cause_type": entry.get("root_cause_type", "unknown"),
            "severity": entry.get("severity", ""),
            "resolution": entry.get("resolution", []),
            "explanation": entry.get("explanation", ""),
            "causes": entry.get("causes", []),
            "contradictions": entry.get("contradictions", []),
            "related_patterns": entry.get("related_patterns", []),
            "prevention": entry.get("prevention", []),
            "confidence_factors": entry.get("confidence_factors", []),
        }

    # ------------------------------------------------------------------
    # FILTERING
    # ------------------------------------------------------------------

    def _filter_by_resource(
        self, candidates: list, primary_resource: str, min_results: int
    ) -> list:
        """
        Cascading resource filter:
        1. Exact match on metadata.resource == primary_resource
        2. Resource in tags OR pattern_type is cascade/correlation
        3. Fallback to all candidates
        """
        # Level 1: Exact resource match
        exact = [
            (s, e)
            for s, e in candidates
            if e.get("metadata", {}).get("resource") == primary_resource
        ]
        if len(exact) >= min_results:
            return exact

        # Level 2: Resource in tags or cross-resource pattern type
        relaxed = [
            (s, e)
            for s, e in candidates
            if (
                e.get("metadata", {}).get("resource") == primary_resource
                or primary_resource in e.get("tags", [])
                or e.get("metadata", {}).get("pattern_type") in ("cascade", "correlation")
            )
        ]
        if len(relaxed) >= min_results:
            return relaxed

        # Level 3: All candidates
        return candidates

    # ------------------------------------------------------------------
    # RE-RANKING
    # ------------------------------------------------------------------

    def _rerank(self, candidates: list, diagnosis_output: dict) -> list:
        """
        Re-rank candidates using signal matching and contradiction checking.

        Score adjustments:
        +0.10  scenario match (cascade_failure when multi-resource)
        +0.08  scenario match (resource_contention when critical)
        +0.05  root_cause_type match
        +0.05  severity match
        +0.03  per matching signal tag
        +0.08  process name appears in KB signals
        -0.15  contradiction triggered (KB says this diagnosis is WRONG)
        """
        diag = diagnosis_output.get("diagnosis", {})
        signals = diagnosis_output.get("signals", {})
        evidence = diagnosis_output.get("evidence", {})
        stage = diag.get("stage", "")
        severity = diag.get("severity", "")

        # Build active signal tags from diagnosis
        active_tags = self._derive_active_tags(signals, evidence)

        # Count distressed resources for cascade detection
        resource_count = sum([
            evidence.get("cpu", 0) > 50,
            evidence.get("memory", 0) > 80,
            evidence.get("disk", 0) > 90,
        ])

        scored = []
        for base_score, entry in candidates:
            adjustment = 0.0

            # --- Scenario match ---
            entry_scenario = entry.get("scenario", "")
            if resource_count >= 2 and entry_scenario == "cascade_failure":
                adjustment += 0.10
            elif stage == "critical" and entry_scenario in ("cascade_failure", "resource_contention"):
                adjustment += 0.08
            elif stage == "early_warning" and entry_scenario == "gradual_degradation":
                adjustment += 0.05
            elif entry_scenario == "sudden_spike" and signals.get("cpu_spike"):
                adjustment += 0.07

            # --- Root cause type match ---
            root_cause_text = diag.get("root_cause", "").lower()
            entry_rct = entry.get("root_cause_type", "")
            rct_matches = {
                "leak": "memory_leak",
                "misconfigur": "misconfiguration",
                "kernel": "kernel_issue",
                "workload": "workload",
                "system_behavior": "system_behavior",
            }
            for keyword, rct_val in rct_matches.items():
                if keyword in root_cause_text and entry_rct == rct_val:
                    adjustment += 0.05
                    break

            # --- Severity match ---
            if entry.get("severity") == severity:
                adjustment += 0.05

            # --- Signal tag overlap ---
            entry_signal_tags = set(entry.get("signal_tags", []))
            overlap = active_tags & entry_signal_tags
            adjustment += len(overlap) * 0.03

            # --- Process match ---
            diag_process = evidence.get("process", "")
            if diag_process and diag_process not in ("unknown", "idle"):
                entry_signals = entry.get("signals", [])
                if any(diag_process.lower() in str(s).lower() for s in entry_signals):
                    adjustment += 0.08

            # --- Contradiction check ---
            contradictions = entry.get("contradictions", [])
            contradiction_hit = self._check_contradictions(
                contradictions, evidence, signals
            )
            if contradiction_hit:
                adjustment -= 0.15
                logger.debug(
                    f"Contradiction triggered for {entry['id']}: {contradiction_hit}"
                )

            scored.append((base_score + adjustment, entry))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored

    def _derive_active_tags(self, signals: dict, evidence: dict) -> set:
        """
        Derive KB signal_tags vocabulary from diagnosis signals and evidence.
        Maps diagnosis signal names to the tag vocabulary used in KB entries.
        """
        active_tags = set()

        # Memory
        if signals.get("memory_pressure") or evidence.get("memory", 0) > 85:
            active_tags.add("high_memory")
        if signals.get("memory_leak"):
            active_tags.update(["memory_leak", "memory_growth"])

        # Disk
        if signals.get("disk_saturation") or signals.get("disk_pressure") or evidence.get("disk", 0) > 90:
            active_tags.update(["high_disk", "disk_risk"])
        fill_rate = evidence.get("disk_fill_rate_mb_sec", 0)
        if fill_rate > 5:
            active_tags.add("rapid_fill")
        elif fill_rate > 0:
            active_tags.add("slow_fill")

        # CPU
        if signals.get("cpu_stress") or signals.get("cpu_saturation") or evidence.get("cpu", 0) > 60:
            active_tags.update(["high_cpu", "sustained_cpu"])
        if signals.get("cpu_spike"):
            active_tags.update(["cpu_spike", "high_volatility", "transient"])

        # Process
        if signals.get("process_bottleneck") or signals.get("dominant_process_heavy"):
            process = evidence.get("process", "").lower()
            if "memcompression" in process:
                active_tags.add("memcompression_dominant")
            elif "svchost" in process:
                active_tags.add("svchost_dominant")
            elif "system" in process:
                active_tags.add("system_dominant")
            elif "msmpeng" in process:
                active_tags.add("defender_dominant")
            elif "tiworker" in process:
                active_tags.add("tiworker_dominant")
            elif "searchindexer" in process:
                active_tags.add("searchindexer_dominant")
            elif "w3wp" in process:
                active_tags.add("w3wp_dominant")
            elif "sqlservr" in process:
                active_tags.add("sqlserver_dominant")
            elif "wmiprvse" in process:
                active_tags.add("wmiprvse_dominant")
            elif "chrome" in process:
                active_tags.add("chrome_dominant")

        # Cascade
        resource_count = sum([
            evidence.get("cpu", 0) > 50,
            evidence.get("memory", 0) > 80,
            evidence.get("disk", 0) > 90,
        ])
        if resource_count >= 2:
            active_tags.add("cascade")
        if resource_count >= 2 and signals.get("memory_pressure"):
            active_tags.add("system_dominant")

        return active_tags

    # ------------------------------------------------------------------
    # CONTRADICTION CHECKER
    # ------------------------------------------------------------------

    def _check_contradictions(
        self,
        contradictions: list,
        evidence: dict,
        signals: dict,
    ) -> Optional[str]:
        """
        Check if any KB entry contradictions match the current diagnosis signals.

        Returns the first triggered contradiction string, or None.

        Checks real conditions:
        - Metric threshold contradictions (memory < 70, disk fill_rate > 5, etc.)
        - Signal state contradictions (cpu.sustained_high = false, etc.)
        - Process contradictions
        """
        if not contradictions:
            return None

        cpu_val = evidence.get("cpu", 0)
        mem_val = evidence.get("memory", 0)
        disk_val = evidence.get("disk", 0)
        process = evidence.get("process", "").lower()
        fill_rate = evidence.get("disk_fill_rate_mb_sec", 0)

        for contradiction in contradictions:
            c = contradiction.lower()

            # --- Memory threshold contradictions ---
            # "If memory.current < 70%"
            if "memory" in c and "< 70" in c and mem_val < 70:
                return contradiction
            # "If memory.current < 80%"
            if "memory" in c and "< 80" in c and "not" not in c and mem_val < 80:
                return contradiction

            # --- Disk fill_rate contradictions ---
            # "If disk.fill_rate_mb_sec is high (>5 MB/s)" = fast fill contradicts slow patterns
            if "fill_rate" in c and "> 5" in c and fill_rate > 5:
                return contradiction
            # "If disk.fill_rate < 1 MB/s" = slow fill contradicts fast patterns
            if "fill_rate" in c and "< 1" in c and 0 < fill_rate < 1:
                return contradiction

            # --- CPU state contradictions ---
            # "If cpu.sustained_high = true" when it shouldn't be
            if "sustained_high" in c and "true" in c:
                if signals.get("cpu_saturation") or signals.get("cpu_sustained_high"):
                    return contradiction
            # "If cpu.sustained_high = false" when sustained IS expected
            if "sustained_high" in c and "false" in c:
                if not signals.get("cpu_saturation") and not signals.get("cpu_sustained_high"):
                    return contradiction

            # "If cpu.spike = true but cpu.sustained_high = false"
            if "spike" in c and "true" in c and "sustained" in c and "false" in c:
                if signals.get("cpu_spike") and not signals.get("cpu_saturation"):
                    return contradiction

            # --- Disk never full contradiction ---
            # "If disk was never at 100%"
            if "disk" in c and "never" in c and "100" in c and disk_val < 99:
                return contradiction

            # --- Process contradictions ---
            # "If [process] is NOT the dominant process"
            if "not" in c and "dominant" in c:
                # Extract process name from contradiction like "If sqlservr.exe is NOT the dominant"
                for proc_name in [
                    "sqlservr", "msmpeng", "tiworker", "searchindexer",
                    "system", "memcompression", "svchost", "w3wp",
                    "wmiprvse", "chrome",
                ]:
                    if proc_name in c and proc_name not in process:
                        return contradiction

            # --- Only one resource stressed ---
            # "If only one resource is stressed, not a cascade"
            if "only one resource" in c:
                distressed = sum([cpu_val > 60, mem_val > 80, disk_val > 90])
                if distressed <= 1:
                    return contradiction

            # --- CPU share too low contradiction ---
            # "If [process] cpu_share < 10%"
            if "cpu_share" in c and "< 10" in c:
                # We don't have per-process cpu_share in evidence, skip
                pass

            # --- Volatility contradictions ---
            if "volatility" in c and "high" in c:
                if signals.get("cpu_spike"):
                    return contradiction
            if "volatility" in c and "low" in c:
                if not signals.get("cpu_spike") and signals.get("cpu_saturation"):
                    return contradiction

        return None

    # ------------------------------------------------------------------
    # GRAPH EXPANSION
    # ------------------------------------------------------------------

    def _expand_related(self, ranked: list, top_k: int) -> list:
        """
        Expand results using related_patterns links from top results.

        If the #1 result has related_patterns like ["KB-WIN-CASCADE-001"],
        and that entry isn't already in our results, consider adding it
        (with a discounted score) to provide the LLM with richer context.

        Only expands from the top result to avoid over-expansion.
        """
        if not ranked:
            return ranked

        existing_ids = {entry["id"] for _, entry in ranked}

        # Only expand from top 2 results
        expansion_candidates = []
        for _, entry in ranked[:2]:
            related_ids = entry.get("related_patterns", [])
            for rid in related_ids:
                if rid not in existing_ids:
                    related_entry = self.store.get_entry_by_id(rid)
                    if related_entry:
                        # Discount: related entries get 85% of the parent's score
                        parent_score = ranked[0][0]
                        discounted_score = parent_score * 0.85
                        expansion_candidates.append((discounted_score, related_entry))
                        existing_ids.add(rid)

        if expansion_candidates:
            # Insert related entries and re-sort
            ranked.extend(expansion_candidates)
            ranked.sort(key=lambda x: x[0], reverse=True)
            logger.debug(
                f"Graph expansion added {len(expansion_candidates)} related entries"
            )

        return ranked