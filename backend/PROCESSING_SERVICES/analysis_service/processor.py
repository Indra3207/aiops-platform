import logging
from .rag_client import RAGClient
from .llm_engine import LLMEngine
from .response_builder import ResponseBuilder

logger = logging.getLogger(__name__)

class AnalysisProcessor:
    def __init__(self):
        self.rag_client = RAGClient()
        self.llm_engine = LLMEngine()
        self.response_builder = ResponseBuilder()

    def process_diagnosis(self, diagnosis_payload: dict) -> dict:
        """
        Core Pipeline Execution
        1. Context Retrieval (FAISS)
        2. LLM Translation 
        3. Response Building
        """
        logger.info(f"--- Processing Diagnosis for {diagnosis_payload.get('system_id')} ---")
        
        # 1. Retrieve Context
        try:
            rag_context = self.rag_client.retrieve(diagnosis_payload, top_k=3)
            logger.info(f"RAG Retrieval Complete. Found {len(rag_context.get('results', []))} entries.")
        except Exception as e:
            logger.error(f"RAG Retrieval failed: {e}")
            rag_context = {"results": [], "error": str(e)}

        # 2. LLM Translation
        try:
            llm_output = self.llm_engine.generate_explanation(diagnosis_payload, rag_context)
            logger.info("LLM Generation Complete.")
        except Exception as e:
            logger.error(f"LLM Engine failed: {e}")
            llm_output = {} # Fallback

        # 3. Build Final Schema
        logger.info("Merging RAG, LLM, and Deterministic Data...")
        final_response = self.response_builder.build_final_response(diagnosis_payload, llm_output)
        
        # Add original timestamp tracking
        original_meta = diagnosis_payload.get("meta", {})
        final_response["meta"] = {
            "origin_generated_at": original_meta.get("generated_at"),
            "analysis_engine_version": "v1.1"
        }

        return final_response
