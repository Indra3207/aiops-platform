import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ResponseBuilder:
    
    @staticmethod
    def calculate_health_score(diagnosis_data: dict) -> int:
        """
        Deterministic Health Score 0-100 entirely separate from LLM.
        """
        base_score = 100
        
        diag = diagnosis_data.get("diagnosis", {})
        evidence = diagnosis_data.get("evidence", {})
        signals = diagnosis_data.get("signals", {})
        
        # Severity penalty
        severity = diag.get("severity", "NORMAL")
        if severity == "CRITICAL":
            base_score -= 40
        elif severity == "HIGH":
            base_score -= 25
        elif severity == "MEDIUM":
            base_score -= 10
            
        # Metric penalties
        if signals.get("disk_saturation", False) or evidence.get("disk", 0) > 95:
            base_score -= 20
        if signals.get("memory_pressure", False) or evidence.get("memory", 0) > 90:
            base_score -= 15
        if signals.get("cpu_stress", False) or evidence.get("cpu", 0) > 85:
            base_score -= 10
            
        return max(0, base_score)

    def build_final_response(self, kafka_payload: dict, llm_output: dict) -> dict:
        """
        Merges deterministic pipeline JSON, LLM output, and calculations into 
        the exact format the React Frontend expects.
        """
        health_score = self.calculate_health_score(kafka_payload)
        diag = kafka_payload.get("diagnosis", {})
        sys_id = kafka_payload.get("system_id", "UNKNOWN-SYS")
        overall_status = "critical" if health_score < 50 else ("attention" if health_score < 80 else "healthy")
        
        return {
            "system_info": {
                "system_id": sys_id,
                "owner": "Auto-Discovered",
                "system_type": "Monitored Endpoint",
                "assigned_technician": "Unassigned",
                "health_score": health_score,
                "overall_status": overall_status,
                "severity": diag.get("severity", "MEDIUM"),
                "sla_hours": -1 if diag.get("severity") == "CRITICAL" else 4
            },
            "diagnosis": {
                "verdict": llm_output.get("verdict"),
                "confidence": diag.get("confidence", 0.0) * 100,  # convert 0.9 to 90
                "predicted_window": llm_output.get("predicted_window")
            },
            "explanations": {
                "technical": llm_output.get("technical_explanation"),
                "admin_assessments": {
                    "hardware": llm_output.get("admin_hardware_assessment"),
                    "software": llm_output.get("admin_software_assessment"),
                    "security": llm_output.get("admin_security_assessment")
                },
                "user_friendly": {
                    "what": llm_output.get("user_what"),
                    "why": llm_output.get("user_why"),
                    "hardware_fault": llm_output.get("user_hardware_fault")
                }
            },
            "signals": {
                "hardware_state": llm_output.get("hardware_state"),
                "hardware_metrics": [],  # Can map raw hardware features here
                "software_state": llm_output.get("software_state"),
                "software_metrics": {},
                "security_state": llm_output.get("security_state"),
                "security_metrics": {}
            },
            "user_actions": llm_output.get("user_actions", []),
            "technician_resolutions": llm_output.get("technician_resolutions", []),
            "timeline": [
                {
                    "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 
                    "event": "Analysis completed and synthesized"
                }
            ]
        }
