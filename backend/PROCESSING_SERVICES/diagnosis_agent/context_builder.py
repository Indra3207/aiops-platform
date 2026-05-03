from typing import List, Dict, Any, Optional

def build_context(feature: Dict[str, Any], alerts: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    if alerts is None:
        alerts = []

    flags = feature.get("flags", {})
    cpu = feature.get("cpu", {})
    memory = feature.get("memory", {})
    disk = feature.get("disk", {})
    process = feature.get("process", {})

    ctx = {
        # Raw value thresholds
        "memory_high": memory.get("current", 0) > 90,
        "disk_critical": disk.get("current", 0) > 95,
        "cpu_high": cpu.get("current", 0) > 70,

        # Behavioral patterns
        "memory_leak": memory.get("leak_pattern", False),
        "disk_fast_fill": disk.get("fill_rate_mb_sec", 0) > 10,
        "disk_risk_high": disk.get("risk", False),

        # CPU deeper context
        "cpu_trend_increasing": cpu.get("trend") == "increasing",
        "cpu_volatility_high": cpu.get("volatility") == "high",
        "cpu_sustained_high": cpu.get("sustained_high", False),

        # Process context
        "dominant_process": process.get("dominant", "unknown"),
        "process_cpu": process.get("cpu_share", 0),

        # Flag alignment (checking if flag matches raw data reality)
        "flags_aligned": (
            (flags.get("high_cpu", False) == (cpu.get("current", 0) > 70)) and
            (flags.get("disk_critical", False) == (disk.get("current", 0) > 95))
        ),

        "active_alerts": [a["alert_type"] for a in alerts if a.get("status") == "ACTIVE"]
    }

    return ctx