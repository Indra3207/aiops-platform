"""
Monitoring Service — Event Processor
======================================
Orchestrates rule evaluation, alert deduplication, state-based
resolution, and Kafka emission with structured logging.
"""

import logging
import time

from rule_engine import evaluate
from config import SEVERITY_COOLDOWN
from state import (
    is_alert_active,
    set_alert_active,
    set_alert_resolved,
    is_cooldown_passed,
    get_all_active_alert_keys,
)
from models import Alert

logger = logging.getLogger("monitoring.processor")

# ─────────────────── Simple Counters ──────────────────────────
_stats = {
    "events_processed": 0,
    "alerts_emitted": 0,
    "alerts_resolved": 0,
    "alerts_suppressed": 0,
    "errors": 0,
}


def get_stats() -> dict:
    """Return a snapshot of processing statistics."""
    return dict(_stats)


async def process_event(event: dict, kafka) -> None:
    """
    Evaluate rules against one telemetry event, manage alert lifecycle,
    and emit alerts / resolutions to Kafka.
    """
    system_id = event.get("system_id")
    if not system_id:
        logger.warning("Event missing system_id — skipping")
        return

    _stats["events_processed"] += 1
    t0 = time.monotonic()

    # ── Evaluate rules ────────────────────────────────────────
    try:
        new_alerts = evaluate(system_id, event)
    except Exception:
        _stats["errors"] += 1
        logger.exception("Rule evaluation failed for %s", system_id)
        return

    # Collect the alert_types triggered in this event
    triggered_types: set[str] = set()

    for alert in new_alerts:
        triggered_types.add(alert.alert_type)

        # Dedup: if this alert is already ACTIVE, suppress it
        if is_alert_active(system_id, alert.alert_type):
            _stats["alerts_suppressed"] += 1
            logger.debug("Suppressed duplicate: %s/%s",
                         system_id, alert.alert_type)
            continue

        # Cooldown check (severity-based)
        cooldown = SEVERITY_COOLDOWN.get(alert.severity, 60)
        if not is_cooldown_passed(system_id, alert.alert_type, cooldown):
            _stats["alerts_suppressed"] += 1
            logger.debug("Cooldown active: %s/%s",
                         system_id, alert.alert_type)
            continue

        # ── Emit new ACTIVE alert ─────────────────────────────
        # Only maintain lifecycle for sustained alerts and critical alerts
        is_sustained = alert.tags.get("pattern") == "sustained" if alert.tags else False
        has_lifecycle = alert.severity == "CRITICAL" or is_sustained
        
        if has_lifecycle:
            set_alert_active(system_id, alert.alert_type)

        try:
            await kafka.produce(alert.model_dump())
            _stats["alerts_emitted"] += 1
            logger.info(
                "🚨 ALERT  [%s] %s | %s | %s = %.1f | confidence=%.2f",
                alert.severity, system_id, alert.alert_type,
                alert.metric, alert.value, alert.confidence,
            )
        except Exception:
            _stats["errors"] += 1
            logger.exception("Failed to produce alert for %s", system_id)

    # ── Check for conditions that have RESOLVED ───────────────
    active_keys = get_all_active_alert_keys()
    for key in list(active_keys):
        sid, atype = key.split(":", 1)
        if sid != system_id:
            continue

        if atype not in triggered_types:
            # Condition cleared → emit RESOLVED alert
            set_alert_resolved(system_id, atype)

            resolved = Alert.create(
                system_id=system_id,
                alert_type=atype,
                severity="INFO",
                metric="resolved",
                value=0,
                threshold=None,
                message=f"Condition {atype} has been resolved",
                category="RESOLVED",
                short_code="RES_000",
                confidence=1.0,
                status="RESOLVED",
                tags={"pattern": "resolved"}
            )

            try:
                await kafka.produce(resolved.model_dump())
                _stats["alerts_resolved"] += 1
                logger.info(
                    "✅ RESOLVED  %s | %s", system_id, atype,
                )
            except Exception:
                _stats["errors"] += 1
                logger.exception("Failed to produce RESOLVED for %s/%s",
                                 system_id, atype)

    elapsed = (time.monotonic() - t0) * 1000
    logger.debug("Processed %s in %.1f ms", system_id, elapsed)