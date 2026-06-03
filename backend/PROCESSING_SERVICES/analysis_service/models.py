"""
Analysis Service — Data Models (Pydantic)

LLMExplanationGeneration: strict output schema the LLM must produce.
LLM MUST ONLY generate: explanations, assessments, resolutions, predictions.
LLM MUST NEVER generate: severity, confidence, telemetry values, health score.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Literal


class UserAction(BaseModel):
    """Single user action item with icon and text."""
    text: str
    icon: str


class LLMExplanationGeneration(BaseModel):
    """
    STRICT LLM OUTPUT SCHEMA.
    All fields are mandatory. Validated before reaching frontend.
    """

    # ── Top-level verdict ─────────────────────────────────────────────────
    verdict: str = Field(..., description="Short precise verdict of the issue (1-2 sentences)")
    predicted_window: str = Field(..., description="E.g. 'Within 12 hours', 'Imminent', 'Stable for 48 hours'")

    # ── Technician layer ──────────────────────────────────────────────────
    technical_explanation: str = Field(..., description="Deep technical breakdown for Technician view")
    technician_resolutions: List[str] = Field(..., description="Ordered list of technical remediation steps", min_length=1)

    # ── Admin layer ───────────────────────────────────────────────────────
    admin_hardware_assessment: str = Field(..., description="Admin-level hardware assessment prose")
    admin_software_assessment: str = Field(..., description="Admin-level software assessment prose")
    admin_security_assessment: str = Field(..., description="Admin-level security assessment prose")

    # ── User layer ────────────────────────────────────────────────────────
    user_what: str = Field(..., description="Plain-English explanation of what is happening")
    user_why: str = Field(..., description="What the user might notice / symptom impact")
    user_hardware_fault: str = Field(..., description="Yes/No + brief explanation about physical fault")
    user_actions: List[UserAction] = Field(..., description="Suggested actions for user", min_length=1)

    # ── State indicators ──────────────────────────────────────────────────
    hardware_state: Literal["good", "attention", "critical"] = Field(
        ..., description="Must be exactly: good, attention, or critical"
    )
    software_state: Literal["good", "attention", "critical"] = Field(
        ..., description="Must be exactly: good, attention, or critical"
    )
    security_state: Literal["good", "attention", "critical"] = Field(
        ..., description="Must be exactly: good, attention, or critical"
    )

    @field_validator("technician_resolutions")
    @classmethod
    def resolutions_not_empty(cls, v):
        if not v or all(not item.strip() for item in v):
            raise ValueError("technician_resolutions must not be empty")
        return v
