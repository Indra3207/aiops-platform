"""
Monitoring Service — Alert Model
=================================
Production-grade alert schema with enrichment fields for downstream
consumers (Diagnosis Agent, dashboards, storage).
"""

from pydantic import BaseModel
import uuid
import time


class Alert(BaseModel):
    # ── Identity ──
    alert_id: str
    system_id: str
    timestamp: int

    # ── Classification ──
    alert_type: str
    severity: str                       # MEDIUM | HIGH | CRITICAL
    priority: int                       # 1 (CRITICAL) to 5 (INFO)
    category: str = "GENERAL"           # CPU | MEMORY | DISK | PROCESS
    short_code: str = "GEN_000"         # machine-readable rule ID
    tags: dict = {}                     # metadata for filtering/RAG

    # ── Metric data ──
    metric: str
    value: float
    threshold: float | None = None

    # ── Enrichment ──
    message: str
    confidence: float = 1.0             # 0.0 – 1.0 rule-based score
    status: str = "ACTIVE"              # ACTIVE | RESOLVED
    source: str = "monitoring_agent"

    @staticmethod
    def create(
        system_id: str,
        alert_type: str,
        severity: str,
        metric: str,
        value: float,
        threshold: float | None,
        message: str,
        category: str = "GENERAL",
        short_code: str = "GEN_000",
        confidence: float = 1.0,
        status: str = "ACTIVE",
        tags: dict | None = None,
    ) -> "Alert":
        # Map severity to priority
        priority_map = {
            "CRITICAL": 1,
            "HIGH": 2,
            "MEDIUM": 3,
            "LOW": 4,
            "INFO": 5
        }
        priority = priority_map.get(severity, 5)

        return Alert(
            alert_id=str(uuid.uuid4()),
            system_id=system_id,
            timestamp=int(time.time()),
            alert_type=alert_type,
            severity=severity,
            priority=priority,
            category=category,
            short_code=short_code,
            tags=tags or {},
            metric=metric,
            value=value,
            threshold=threshold,
            message=message,
            confidence=confidence,
            status=status,
        )