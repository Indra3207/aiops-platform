"""
Analysis Service — Response Builder

Merges deterministic diagnosis output + computed backend values + validated LLM output
into the exact JSON schema that the React frontend expects.

DETERMINISTIC (never from LLM):
  - health_score
  - severity
  - confidence
  - root_cause
  - overall_status
  - sla_hours

AI-GENERATED (from LLM):
  - verdict, predicted_window
  - technical_explanation, technician_resolutions
  - admin_*_assessment
  - user_what, user_why, user_hardware_fault, user_actions
  - hardware_state, software_state, security_state
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ResponseBuilder:

    @staticmethod
    def calculate_health_score(diagnosis_payload: dict) -> int:
        """
        Deterministic health score 0–100.
        Entirely independent of LLM — uses diagnosis + evidence + signals.
        """
        base_score = 100

        diag = diagnosis_payload.get("diagnosis", {})
        evidence = diagnosis_payload.get("evidence", {})
        signals = diagnosis_payload.get("signals", {})

        # Severity penalty
        severity = diag.get("severity", "MEDIUM")
        if severity == "CRITICAL":
            base_score -= 40
        elif severity == "HIGH":
            base_score -= 25
        elif severity == "MEDIUM":
            base_score -= 10

        # Metric penalties (additive)
        if signals.get("disk_saturation", False) or evidence.get("disk", 0) > 95:
            base_score -= 20
        elif evidence.get("disk", 0) > 85:
            base_score -= 10

        if signals.get("memory_pressure", False) or evidence.get("memory", 0) > 90:
            base_score -= 15
        elif evidence.get("memory", 0) > 75:
            base_score -= 7

        if signals.get("cpu_stress", False) or evidence.get("cpu", 0) > 85:
            base_score -= 10
        elif evidence.get("cpu", 0) > 70:
            base_score -= 5

        # Multi-resource cascade penalty
        if signals.get("memory_pressure") and signals.get("disk_saturation"):
            base_score -= 10

        return max(0, min(100, base_score))

    def build_final_response(
        self,
        diagnosis_payload: dict,
        llm_output: dict,
        ai_status: str = "ready",
    ) -> dict:
        """
        Build the final merged response for the frontend.

        Args:
            diagnosis_payload: Output from Diagnosis Agent (deterministic)
            llm_output: Validated output from LLM Engine
            ai_status: "loading" | "ready" | "fallback"
                       - "loading": used when pushing the deterministic-only first pass
                       - "ready": LLM generation complete
                       - "fallback": LLM failed, safe fallback used
        """
        health_score = self.calculate_health_score(diagnosis_payload)
        diag = diagnosis_payload.get("diagnosis", {})
        evidence = diagnosis_payload.get("evidence", {})
        signals = diagnosis_payload.get("signals", {})
        system_id = diagnosis_payload.get("system_id", "UNKNOWN-SYS")

        severity = diag.get("severity", "MEDIUM")
        confidence_raw = diag.get("confidence", 0.0)
        confidence_pct = round(confidence_raw * 100, 1) if confidence_raw <= 1.0 else round(confidence_raw, 1)

        overall_status = (
            "critical" if health_score < 50
            else "warning" if health_score < 80
            else "healthy"
        )

        sla_hours = -1 if severity == "CRITICAL" else (2 if severity == "HIGH" else 4)

        # ── Build live signals list (for frontend signal cards) ──────────────
        signal_cards = []
        if evidence.get("cpu", 0) > 0:
            cpu_val = evidence["cpu"]
            signal_cards.append({
                "name": "CPU Usage",
                "value": f"{cpu_val:.1f}%",
                "status": "critical" if cpu_val > 85 else ("warning" if cpu_val > 65 else "good"),
                "trend": "increasing" if signals.get("cpu_stress") else "stable",
            })
        if evidence.get("memory", 0) > 0:
            mem_val = evidence["memory"]
            signal_cards.append({
                "name": "Memory Pressure",
                "value": f"{mem_val:.1f}%",
                "status": "critical" if mem_val > 90 else ("warning" if mem_val > 75 else "good"),
                "trend": "increasing" if signals.get("memory_leak") else "stable",
            })
        if evidence.get("disk", 0) > 0:
            disk_val = evidence["disk"]
            signal_cards.append({
                "name": "Disk Utilization",
                "value": f"{disk_val:.1f}%",
                "status": "critical" if disk_val > 92 else ("warning" if disk_val > 78 else "good"),
                "trend": "increasing" if signals.get("disk_saturation") else "stable",
            })
        if evidence.get("process", "unknown") not in ("unknown", ""):
            signal_cards.append({
                "name": "Dominant Process",
                "value": evidence["process"],
                "status": "warning" if signals.get("process_bottleneck") else "good",
                "trend": "stable",
            })

        return {
            # ── System identity ────────────────────────────────────────────
            "system_info": {
                "system_id": system_id,
                "owner": "Auto-Discovered",
                "system_type": "Monitored Endpoint",
                "assigned_technician": "Unassigned",
                "health_score": health_score,
                "overall_status": overall_status,
                "severity": severity,
                "sla_hours": sla_hours,
            },

            # ── Deterministic diagnosis ────────────────────────────────────
            "diagnosis": {
                "root_cause": diag.get("root_cause", "Unknown"),
                "primary_resource": diag.get("primary_resource", "unknown"),
                "stage": diag.get("stage", "active"),
                "confidence": confidence_pct,
                "priority": diagnosis_payload.get("priority", 3),
                # LLM verdict + window (safe — LLM provides these, not severity)
                "verdict": llm_output.get("verdict"),
                "predicted_window": llm_output.get("predicted_window"),
            },

            # ── AI status for progressive frontend rendering ────────────────
            "ai_status": ai_status,  # "loading" | "ready" | "fallback"

            # ── LLM explanations ───────────────────────────────────────────
            "explanations": {
                "technical": llm_output.get("technical_explanation"),
                "admin_assessments": {
                    "hardware": llm_output.get("admin_hardware_assessment"),
                    "software": llm_output.get("admin_software_assessment"),
                    "security": llm_output.get("admin_security_assessment"),
                },
                "user_friendly": {
                    "what": llm_output.get("user_what"),
                    "why": llm_output.get("user_why"),
                    "hardware_fault": llm_output.get("user_hardware_fault"),
                },
            },

            # ── Signal state (LLM-derived) + evidence metrics (deterministic) ──
            "signals": {
                "hardware_state": llm_output.get("hardware_state", "attention"),
                "software_state": llm_output.get("software_state", "attention"),
                "security_state": llm_output.get("security_state", "good"),
                "signal_cards": signal_cards,  # for frontend dashboard cards
                "raw_evidence": evidence,       # for technician detail view
                "impact": diag.get("impact", []),
            },

            # ── Actions ────────────────────────────────────────────────────
            "user_actions": llm_output.get("user_actions", []),
            "technician_resolutions": llm_output.get("technician_resolutions", []),

            # ── Timeline ───────────────────────────────────────────────────
            "timeline": [
                {
                    "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "event": "AI analysis completed and synthesized",
                }
            ],
        }

    def build_loading_response(self, diagnosis_payload: dict) -> dict:
        """
        Build a response with only deterministic data for the immediate frontend push.
        LLM fields are None — frontend shows 'Generating AI analysis...' skeletons.
        """
        return self.build_final_response(
            diagnosis_payload=diagnosis_payload,
            llm_output={},
            ai_status="loading",
        )
