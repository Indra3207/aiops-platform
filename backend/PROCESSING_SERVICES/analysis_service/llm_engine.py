"""
Analysis Service — LLM Engine

Calls OpenAI API to generate structured AI explanations.

Rules:
  - Uses gpt-4o with JSON mode (response_format=json_object)
  - Stateless requests — no conversation history, no streaming
  - Retry once on failure
  - 30s timeout
  - Falls back to deterministic mock when OPENAI_API_KEY is not set
    OR when both attempts fail

LLM MUST ONLY generate: explanations, assessments, resolutions, predictions.
LLM MUST NEVER generate: severity, confidence, telemetry values, health score.
"""

import json
import logging

from config import config
from prompt_builder import build_prompt
from schema_validator import validate_llm_output

logger = logging.getLogger(__name__)


# ── Mock fallback (used when no API key or LLM is unavailable) ────────────────
def _generate_mock(diagnosis_payload: dict) -> dict:
    """
    Deterministic mock response based on diagnosis data.
    Used for local development without an OpenAI API key.
    """
    diag = diagnosis_payload.get("diagnosis", {})
    cause = diag.get("root_cause", "Anomaly Detected")
    severity = diag.get("severity", "MEDIUM")
    stage = diag.get("stage", "active")
    evidence = diagnosis_payload.get("evidence", {})

    cpu = evidence.get("cpu", 0)
    mem = evidence.get("memory", 0)
    disk = evidence.get("disk", 0)
    process = evidence.get("process", "unknown process")

    # Derive state from evidence
    hw_state = "critical" if disk > 90 or mem > 90 else ("attention" if disk > 75 or mem > 75 else "good")
    sw_state = "critical" if cpu > 85 else ("attention" if cpu > 60 else "good")

    window_map = {"CRITICAL": "Imminent — action required now", "HIGH": "Within 4–8 hours", "MEDIUM": "Within 24 hours"}
    window = window_map.get(severity, "Within 24 hours")

    return {
        "verdict": f"System is experiencing: {cause[:80]}. Immediate attention recommended.",
        "predicted_window": window,
        "technical_explanation": (
            f"Telemetry indicates {cause.lower()}. "
            f"Key metrics: CPU {cpu:.1f}%, Memory {mem:.1f}%, Disk {disk:.1f}%. "
            f"Dominant process: {process}. "
            f"System stage is '{stage}'. Resolution should begin immediately for CRITICAL conditions."
        ),
        "technician_resolutions": [
            f"Identify and terminate or throttle resource-heavy process: {process}",
            "Review system event logs for recent changes or errors",
            "Check disk health with SMART diagnostics if disk utilization is high",
            "Free disk space if saturation is above 90%",
            "Monitor memory growth rate for potential leak patterns",
        ],
        "admin_hardware_assessment": (
            f"Hardware metrics indicate stress. Disk at {disk:.1f}% and memory at {mem:.1f}%. "
            "Physical inspection may be needed if metrics remain elevated."
        ),
        "admin_software_assessment": (
            f"Software workload is contributing to resource pressure via {process}. "
            "Application and service configuration review is recommended."
        ),
        "admin_security_assessment": (
            "No security anomalies detected at this time. Standard monitoring remains active."
        ),
        "user_what": "Your computer is working harder than usual and may feel slower.",
        "user_why": "You might notice applications taking longer to respond or the system feeling sluggish.",
        "user_hardware_fault": "No confirmed hardware damage. The issue appears to be a software or resource overload.",
        "user_actions": [
            {"text": "Save your work now in case a restart is needed.", "icon": "💾"},
            {"text": "Avoid opening new applications until IT clears the issue.", "icon": "⏳"},
            {"text": "Contact IT support if performance does not improve.", "icon": "📞"},
        ],
        "hardware_state": hw_state,
        "software_state": sw_state,
        "security_state": "good",
    }


# ── Real OpenAI call ──────────────────────────────────────────────────────────

def _call_openai(messages: list) -> str:
    """
    Make a single synchronous OpenAI call and return raw content string.
    Raises on failure — caller handles retry.
    """
    from openai import OpenAI

    client = OpenAI(api_key=config.OPENAI_API_KEY, timeout=config.LLM_TIMEOUT)

    response = client.chat.completions.create(
        model=config.LLM_MODEL,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.2,   # Low temp for consistent structured output
        max_tokens=1200,   # Enough for all fields, keeps cost down
    )

    return response.choices[0].message.content


# ── Main Engine ───────────────────────────────────────────────────────────────

class LLMEngine:
    def __init__(self):
        self._has_api_key = bool(config.OPENAI_API_KEY.strip())
        if not self._has_api_key:
            logger.warning(
                "OPENAI_API_KEY is not set. LLM Engine will run in MOCK MODE. "
                "Set OPENAI_API_KEY environment variable to enable real AI generation."
            )
        else:
            logger.info(f"LLM Engine initialized — model: {config.LLM_MODEL}")

    def generate_explanation(self, diagnosis_payload: dict, rag_results: dict) -> dict:
        """
        Generate structured AI explanation for the given diagnosis.

        Flow:
          1. If no API key → return mock
          2. Build prompt
          3. Call OpenAI (attempt 1)
          4. Validate output
          5. If invalid → retry once
          6. If still invalid → return safe fallback
        """
        root_cause = diagnosis_payload.get("diagnosis", {}).get("root_cause", "Unknown issue")
        severity = diagnosis_payload.get("diagnosis", {}).get("severity", "MEDIUM")
        system_id = diagnosis_payload.get("system_id", "UNKNOWN")

        # Mock mode
        if not self._has_api_key:
            logger.info(f"[MOCK MODE] Generating mock explanation for {system_id}")
            return _generate_mock(diagnosis_payload)

        # Build prompt
        messages = build_prompt(diagnosis_payload, rag_results)

        # Attempt 1
        for attempt in range(1, config.LLM_MAX_RETRIES + 2):
            try:
                logger.info(f"LLM call attempt {attempt} for {system_id}")
                raw_output = _call_openai(messages)

                validated, is_fallback = validate_llm_output(raw_output, root_cause, severity)

                if not is_fallback:
                    logger.info(f"LLM generation successful for {system_id} (attempt {attempt})")
                    return validated

                if attempt < config.LLM_MAX_RETRIES + 1:
                    logger.warning(f"Validation failed on attempt {attempt} — retrying...")
                    continue

                # Both attempts failed — return the fallback from validator
                logger.error(f"LLM output invalid after {attempt} attempts — using safe fallback for {system_id}")
                return validated

            except Exception as e:
                if attempt < config.LLM_MAX_RETRIES + 1:
                    logger.warning(f"LLM call failed (attempt {attempt}): {e} — retrying...")
                else:
                    logger.error(f"LLM call failed after all attempts for {system_id}: {e}")
                    from schema_validator import _make_fallback
                    return _make_fallback(root_cause, severity)

        # Should never reach here
        from schema_validator import _make_fallback
        return _make_fallback(root_cause, severity)
