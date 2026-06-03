"""
Analysis Service — Core Processor

Orchestrates the full pipeline for each diagnosis event:

  Step 1: Check cache — avoid duplicate OpenAI calls
  Step 2: Push loading state to frontend via WebSocket (immediate)
  Step 3: RAG retrieval
  Step 4: LLM generation
  Step 5: Schema validation (inside LLMEngine)
  Step 6: Merge deterministic + AI output
  Step 7: Cache result
  Step 8: Push final result to frontend via WebSocket
  Step 9: Return final response (also published to Kafka)
"""

import logging
from rag_client import RAGClient
from llm_engine import LLMEngine
from response_builder import ResponseBuilder
from cache_manager import cache
from websocket_manager import ws_manager

logger = logging.getLogger(__name__)


class AnalysisProcessor:
    def __init__(self):
        logger.info("Initializing AnalysisProcessor components...")
        self.rag_client = RAGClient()
        self.llm_engine = LLMEngine()
        self.response_builder = ResponseBuilder()
        logger.info("AnalysisProcessor ready.")

    async def process_diagnosis(self, diagnosis_payload: dict) -> dict:
        """
        Full async pipeline for a single diagnosis event.
        Returns the final merged response dict.
        """
        system_id = diagnosis_payload.get("system_id", "unknown")
        logger.info(f"=== Processing diagnosis for: {system_id} ===")

        # ── Step 1: Cache check ────────────────────────────────────────────
        cached = cache.get(system_id, diagnosis_payload)
        if cached:
            logger.info(f"Cache HIT — returning cached result for {system_id}")
            # Still push to WebSocket so UI updates even if backend was restarted
            await ws_manager.push_update(cached)
            return cached

        # ── Step 2: Push immediate loading state to frontend ──────────────
        # Frontend shows deterministic diagnosis immediately,
        # AI panels show "Generating AI analysis..." skeletons.
        loading_response = self.response_builder.build_loading_response(diagnosis_payload)
        loading_response["meta"] = {
            "origin_generated_at": diagnosis_payload.get("meta", {}).get("generated_at"),
            "analysis_engine_version": "v1.1",
        }
        await ws_manager.push_update(loading_response)
        logger.info(f"Loading state pushed to frontend for {system_id}")

        # ── Step 3: RAG retrieval ─────────────────────────────────────────
        try:
            rag_context = self.rag_client.retrieve(diagnosis_payload, top_k=3)
            n_results = len(rag_context.get("results", []))
            logger.info(f"RAG retrieval complete — {n_results} entries for {system_id}")
        except Exception as e:
            logger.error(f"RAG retrieval failed for {system_id}: {e}")
            rag_context = {"results": [], "error": str(e)}

        # ── Step 4: LLM generation (with internal retry + validation) ─────
        try:
            llm_output = self.llm_engine.generate_explanation(diagnosis_payload, rag_context)
            logger.info(f"LLM generation complete for {system_id}")
            ai_status = "ready"
        except Exception as e:
            logger.error(f"LLM engine raised unexpectedly for {system_id}: {e}")
            llm_output = {}
            ai_status = "fallback"

        # ── Step 5: Build final merged response ───────────────────────────
        final_response = self.response_builder.build_final_response(
            diagnosis_payload=diagnosis_payload,
            llm_output=llm_output,
            ai_status=ai_status,
        )
        final_response["meta"] = {
            "origin_generated_at": diagnosis_payload.get("meta", {}).get("generated_at"),
            "analysis_engine_version": "v1.1",
        }

        # ── Step 6: Cache result ──────────────────────────────────────────
        cache.set(system_id, diagnosis_payload, final_response)

        # ── Step 7: Push final result to frontend via WebSocket ──────────
        await ws_manager.push_update(final_response)
        logger.info(f"Final result pushed to frontend for {system_id}")

        logger.info(f"=== Done processing {system_id} ===")
        return final_response
