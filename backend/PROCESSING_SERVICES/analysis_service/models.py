from pydantic import BaseModel, Field
from typing import List

class LLMExplanationGeneration(BaseModel):
    """STRICT LLM OUTPUT SCHEMA as requested by architecture."""
    verdict: str = Field(..., description="Short exact verdict of the issue")
    predicted_window: str = Field(..., description="E.g. 'Within 12 hours', 'Imminent', 'Stable'")
    
    technical_explanation: str = Field(..., description="Technical breakdown for Technician UI")
    technician_resolutions: List[str] = Field(..., description="List of deeply technical steps")
    
    admin_hardware_assessment: str = Field(..., description="Prose summary of hardware for Admin UI")
    admin_software_assessment: str = Field(..., description="Prose summary of software for Admin UI")
    admin_security_assessment: str = Field(..., description="Prose summary of security for Admin UI")
    
    user_what: str = Field(..., description="Plain-english explanation of what is happening")
    user_why: str = Field(..., description="Plain-english symptom impact mapping")
    user_hardware_fault: str = Field(..., description="Yes/No and brief explanation of physical fault")
    
    # Must be list of dicts: {"text": "...", "icon": "..."}
    user_actions: List[dict] = Field(..., description="Actions containing 'text' and 'icon'")
    
    hardware_state: str = Field(..., description="MUST BE exactly: good, attention, or critical")
    software_state: str = Field(..., description="MUST BE exactly: good, attention, or critical")
    security_state: str = Field(..., description="MUST BE exactly: good, attention, or critical")
