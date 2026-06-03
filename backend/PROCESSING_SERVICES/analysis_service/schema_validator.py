"""
Analysis Service — Schema Validator

Validates raw LLM string output against LLMExplanationGeneration.
Flow:
  LLM raw string
    → parse JSON
    → Pydantic validate
    → If fail: retry signal returned
    → If double fail: return safe fallback
"""

import json
import logging
from typing import Optional, Tuple
from models import LLMExplanationGeneration, UserAction

logger = logging.getLogger(__name__)


# ── Safe fallback used when LLM output is completely unrecoverable ─────────────
def _make_fallback(root_cause: str, severity: str) -> dict:
    """
    Deterministic fallback when LLM fails twice.
    Values are generic but safe — never hallucinate severity/confidence.
    """
    sev_lower = severity.lower()
    is_critical = sev_lower == "critical"
    is_high = sev_lower == "high"

    if is_critical:
        window = "Imminent — action required immediately"
        hw_state = "critical"
    elif is_high:
        window = "Within 4-8 hours"
        hw_state = "attention"
    else:
        window = "Within 24 hours"
        hw_state = "attention"

    return {
        "verdict": f"System issue detected: {root_cause}. Immediate review recommended.",
        "predicted_window": window,
        "technical_explanation": (
            f"The system has been flagged for: {root_cause}. "
            "Review telemetry and system logs for detailed diagnostics."
        ),
        "technician_resolutions": [
            "Review system event logs for error patterns",
            "Check resource utilization for the flagged component",
            "Escalate to senior engineer if issue persists",
        ],
        "admin_hardware_assessment": (
            "Hardware status requires review based on current system state."
        ),
        "admin_software_assessment": (
            "Software components may be impacted. Application stability should be monitored."
        ),
        "admin_security_assessment": (
            "No confirmed security incidents. Normal monitoring procedures apply."
        ),
        "user_what": "Your system is experiencing a technical issue that is being investigated.",
        "user_why": "You may notice slower performance or some features may be temporarily unavailable.",
        "user_hardware_fault": "No confirmed hardware fault. IT is investigating the root cause.",
        "user_actions": [
            {"text": "Save your work and avoid restarting your system.", "icon": "💾"},
            {"text": "Contact IT support if issues persist.", "icon": "📞"},
        ],
        "hardware_state": hw_state,
        "software_state": "attention",
        "security_state": "good",
    }


def _parse_json(raw: str) -> Optional[dict]:
    """
    Try to extract valid JSON from the LLM response.
    Handles cases where the model wraps output in markdown fences.
    """
    raw = raw.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Remove first line (```json or ```) and last line (```)
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        raw = "\n".join(inner).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try to find JSON object within the string
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end])
            except json.JSONDecodeError:
                pass
    return None


def validate_llm_output(
    raw_output: str,
    root_cause: str = "Unknown issue",
    severity: str = "MEDIUM",
) -> Tuple[dict, bool]:
    """
    Validate and parse LLM output string.

    Returns:
        (validated_dict, is_fallback)
        - is_fallback=False: real LLM output validated successfully
        - is_fallback=True: safe fallback was used
    """
    if not raw_output or not raw_output.strip():
        logger.warning("LLM returned empty output — using fallback.")
        return _make_fallback(root_cause, severity), True

    parsed = _parse_json(raw_output)
    if parsed is None:
        logger.warning("LLM output is not valid JSON — using fallback.")
        return _make_fallback(root_cause, severity), True

    # Pydantic validation
    try:
        # Normalize user_actions: accept both dict and UserAction
        raw_actions = parsed.get("user_actions", [])
        normalized_actions = []
        for a in raw_actions:
            if isinstance(a, dict):
                normalized_actions.append(UserAction(**a))
            else:
                normalized_actions.append(a)
        parsed["user_actions"] = normalized_actions

        validated = LLMExplanationGeneration(**parsed)
        result = validated.model_dump()
        # Convert UserAction objects back to dicts for serialization
        result["user_actions"] = [
            a if isinstance(a, dict) else a.model_dump()
            for a in result["user_actions"]
        ]
        logger.info("LLM output validated successfully.")
        return result, False

    except Exception as e:
        logger.warning(f"Pydantic validation failed: {e} — using fallback.")
        return _make_fallback(root_cause, severity), True
