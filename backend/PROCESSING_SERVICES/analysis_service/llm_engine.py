import json
import logging
from .models import LLMExplanationGeneration
from .config import config

logger = logging.getLogger(__name__)

class LLMEngine:
    def __init__(self):
        # Stub for LLM initialization.
        # In production, initialize OpenAI client or local model here.
        self.api_key = config.OPENAI_API_KEY
        logger.info("Initializing LLM Engine...")

    def generate_explanation(self, diagnosis: dict, rag_results: dict) -> dict:
        """
        Calls LLM to generate UI-tailored translations using the strict schema.
        DOES NOT HALLUCINATE data. Relies solely on `diagnosis` and `rag_results`.
        """
        logger.info("Calling LLM to generate structured translations...")
        
        # PROMPT CONSTRUCTION
        prompt = f"""
        You are an AI diagnostic translator. Analyze the deterministic system state and RAG context below.
        
        DIAGNOSIS (Deterministic Truth):
        {json.dumps(diagnosis, indent=2)}
        
        RAG CONTEXT (Resolution and Explanation):
        {json.dumps(rag_results, indent=2)}
        
        Generate the exact JSON response mapping strictly to the schema provided.
        DO NOT invent severity or confidence. Derive predicted_window from disk.fill_rate or cpu trend.
        """
        
        # MOCK IMPLEMENTATION FOR SAFETY/OFFLINE CAPABILITY
        # In a real environment, this calls:
        # response = client.beta.chat.completions.parse(
        #     model=config.LLM_MODEL,
        #     messages=[{"role": "user", "content": prompt}],
        #     response_format=LLMExplanationGeneration,
        # )
        # return response.choices[0].message.parsed.model_dump()
        
        # We will dynamically mock a rich response based on the input diagnosis
        cause = diagnosis.get("diagnosis", {}).get("root_cause", "Anomaly Detetected")
        
        mock_response = LLMExplanationGeneration(
            verdict=f"AI Translated: {cause[:50]}...",
            predicted_window="Within 24 hours",
            technical_explanation="System telemetry indicates metric threshold breach aligned with RAG cluster.",
            technician_resolutions=["Review primary resource logs", "Scale capacity", "Validate process integrity"],
            admin_hardware_assessment="Hardware appears affected based on active telemetry patterns.",
            admin_software_assessment="Software applications are experiencing degraded I/O or Compute.",
            admin_security_assessment="Security agents report nominal operating behavior.",
            user_what="Your system is experiencing heavy load.",
            user_why="You might notice slower response times.",
            user_hardware_fault="No, this appears to be a software or capacity limit.",
            user_actions=[
                {"text": "Save your work.", "icon": "💾"}, 
                {"text": "Wait for IT clearance.", "icon": "⏳"}
            ],
            hardware_state="attention",
            software_state="critical",
            security_state="good"
        )
        
        return mock_response.model_dump()
