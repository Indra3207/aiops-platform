"""
Analysis Service — Prompt Builder

Constructs a production-grade layered prompt for the LLM.
Designed to:
  1. Eliminate hallucination of deterministic values (severity, confidence, telemetry)
  2. Focus the LLM on ONLY explanation, assessment, and resolution generation
  3. Stay under 4k tokens by extracting only key fields, not full JSON dumps
  4. Use rich RAG context compactly (title + explanation + top 3 resolutions)
"""

import json
from typing import Optional


# ── Output JSON schema definition ─────────────────────────────────────────────
OUTPUT_SCHEMA = """{
  "verdict": "One or two sentence summary of the situation",
  "predicted_window": "e.g. 'Within 12 hours', 'Imminent', 'Stable for 48+ hours'",
  "technical_explanation": "Technical deep-dive for IT engineers (2-4 sentences)",
  "technician_resolutions": ["Step 1...", "Step 2...", "Step 3..."],
  "admin_hardware_assessment": "Hardware impact summary for management (1-2 sentences)",
  "admin_software_assessment": "Software/application impact for management (1-2 sentences)",
  "admin_security_assessment": "Security posture summary for management (1-2 sentences)",
  "user_what": "Plain-English description of what is happening (no jargon)",
  "user_why": "What the user might notice or experience (symptoms)",
  "user_hardware_fault": "Yes/No and brief plain-English explanation of physical fault",
  "user_actions": [{"text": "Action to take", "icon": "emoji"}],
  "hardware_state": "good OR attention OR critical",
  "software_state": "good OR attention OR critical",
  "security_state": "good OR attention OR critical"
}"""


def _build_signal_summary(signals: dict) -> str:
    """Convert boolean signal dict to a compact, readable list."""
    active = [k.replace("_", " ") for k, v in signals.items() if v is True]
    if not active:
        return "No abnormal signals flagged."
    return ", ".join(active)


def _build_evidence_summary(evidence: dict) -> str:
    """Compact evidence summary — only non-zero values."""
    parts = []
    if evidence.get("cpu", 0) > 0:
        parts.append(f"CPU: {evidence['cpu']:.1f}%")
    if evidence.get("memory", 0) > 0:
        parts.append(f"Memory: {evidence['memory']:.1f}%")
    if evidence.get("disk", 0) > 0:
        parts.append(f"Disk: {evidence['disk']:.1f}%")
    if evidence.get("process") and evidence["process"] not in ("unknown", ""):
        parts.append(f"Dominant Process: {evidence['process']}")
    return " | ".join(parts) if parts else "No evidence metrics."


def _build_rag_summary(rag_results: dict) -> str:
    """
    Compact RAG context: title + explanation (first 120 chars) + top 3 resolutions.
    Does NOT dump the full entry to save tokens.
    """
    results = rag_results.get("results", [])
    if not results:
        return "No knowledge base context available."

    sections = []
    for i, entry in enumerate(results[:3], 1):
        title = entry.get("title", f"KB Entry {i}")
        explanation = entry.get("explanation", "")[:180]
        resolutions = entry.get("resolution", [])[:3]
        res_text = "\n".join(f"  - {r}" for r in resolutions) if resolutions else "  - No specific steps."
        sections.append(
            f"[KB-{i}] {title}\n"
            f"  Context: {explanation}\n"
            f"  Resolution steps:\n{res_text}"
        )
    return "\n\n".join(sections)


def build_prompt(diagnosis_payload: dict, rag_results: dict) -> list:
    """
    Build a layered chat-format prompt for OpenAI.

    Returns a list of message dicts for client.chat.completions.create(messages=...).

    Layers:
      1. SYSTEM: role definition + anti-hallucination guardrails
      2. USER: diagnosis context + signals + evidence + RAG + output schema
    """
    diag = diagnosis_payload.get("diagnosis", {})
    evidence = diagnosis_payload.get("evidence", {})
    signals = diagnosis_payload.get("signals", {})
    system_id = diagnosis_payload.get("system_id", "UNKNOWN")

    root_cause = diag.get("root_cause", "Unknown issue")
    severity = diag.get("severity", "MEDIUM")
    stage = diag.get("stage", "active")
    impact_list = diag.get("impact", [])
    impact_text = "\n".join(f"  - {i}" for i in impact_list) if impact_list else "  - Not specified."

    signal_summary = _build_signal_summary(signals)
    evidence_summary = _build_evidence_summary(evidence)
    rag_summary = _build_rag_summary(rag_results)

    # ── SYSTEM MESSAGE ───────────────────────────────────────────────────
    system_message = {
        "role": "system",
        "content": (
            "You are an expert AI operations analyst embedded in an enterprise AIOps platform.\n\n"
            "ABSOLUTE RULES — NEVER violate these:\n"
            "1. DO NOT invent, modify, or reference severity levels, confidence scores, "
            "health scores, or raw telemetry values. These are calculated by the deterministic backend.\n"
            "2. DO NOT contradict the provided root_cause, stage, or impact. These are ground truth.\n"
            "3. DO NOT speculate beyond the provided context. If unsure, say 'Further investigation needed.'\n"
            "4. DO NOT include any text outside the JSON object.\n"
            "5. DO NOT use markdown, code fences, or formatting in the JSON values.\n\n"
            "YOUR ONLY JOB is to generate clear, actionable text explanations for three audiences:\n"
            "  - Technicians: technical, precise, action-oriented\n"
            "  - Admins: business impact, risk, operational summary\n"
            "  - End Users: plain English, reassuring, no jargon\n\n"
            "Respond ONLY with a valid JSON object matching the schema provided."
        ),
    }

    # ── USER MESSAGE ─────────────────────────────────────────────────────
    user_message = {
        "role": "user",
        "content": (
            f"=== SYSTEM UNDER ANALYSIS ===\n"
            f"System ID: {system_id}\n\n"
            f"=== DETERMINISTIC DIAGNOSIS (Ground Truth — Do NOT change) ===\n"
            f"Root Cause: {root_cause}\n"
            f"Severity:   {severity}\n"
            f"Stage:      {stage}\n"
            f"Impact:\n{impact_text}\n\n"
            f"=== ACTIVE SIGNALS ===\n"
            f"{signal_summary}\n\n"
            f"=== EVIDENCE METRICS ===\n"
            f"{evidence_summary}\n\n"
            f"=== KNOWLEDGE BASE CONTEXT (Use this to inform resolutions and explanations) ===\n"
            f"{rag_summary}\n\n"
            f"=== REQUIRED OUTPUT JSON SCHEMA ===\n"
            f"{OUTPUT_SCHEMA}\n\n"
            f"Generate the JSON now. Every field is mandatory. "
            f"hardware_state, software_state, security_state MUST be one of: good, attention, critical."
        ),
    }

    return [system_message, user_message]
