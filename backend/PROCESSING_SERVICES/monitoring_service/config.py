"""
Monitoring Service — Configuration
===================================
All rule thresholds, severity tiers, process filters, and operational
settings live here.  Change thresholds without touching any code.
"""

import logging

# ──────────────────────────── Kafka ────────────────────────────
KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
TELEMETRY_TOPIC = "telemetry"
ALERT_TOPIC = "alerts-stream"

# ──────────────────────────── Operational ──────────────────────
DEBUG_MODE = False
LOG_LEVEL = logging.DEBUG if DEBUG_MODE else logging.INFO

# ──────────────────────────── Sliding Window ──────────────────
WINDOW_SIZE = 5                 # events kept per metric per system

# ──────────────────────────── Global Cooldown (fallback) ──────
ALERT_COOLDOWN_SEC = 60         # default cooldown between duplicate alerts

# ──────────────────────────── Ignored Processes ───────────────
# Explicitly blacklist system-level processes to reduce noise
IGNORED_PROCESSES = {
    "system",
    "system idle process",
    "idle",
    "registry",
}

# ──────────────────────────── Cooldown by Severity ────────────
SEVERITY_COOLDOWN = {
    "CRITICAL": 0,    # Immediate alerting for critical issues
    "HIGH": 60,       # 1 minute between high severity alerts
    "MEDIUM": 120,    # 2 minutes between medium severity alerts
    "LOW": 300,       # 5 minutes between low severity alerts
    "INFO": 60,       # Standard cooldown for info/resolved alerts
}

# ──────────────────────────── Rules Config ────────────────────
# Each rule dict supports:
#   enabled       – toggle without deleting
#   thresholds    – list of (limit, severity) checked HIGH→LOW
#   sustained     – consecutive events above threshold
#   spike_delta   – sudden jump between consecutive values
#   rate          – growth-rate detection
#   cooldown      – per-rule cooldown override (seconds)

RULES_CONFIG = {
    # ── CPU ──────────────────────────────────────────────
    "cpu": {
        "threshold": {
            "enabled": True,
            "tiers": [
                {"min": 95, "severity": "CRITICAL",  "short_code": "CPU_003"},
                {"min": 90, "severity": "HIGH",      "short_code": "CPU_002"},
                {"min": 80, "severity": "MEDIUM",    "short_code": "CPU_001"},
            ],
            "alert_type": "HIGH_CPU",
            "category": "CPU",
        },
        "sustained": {
            "enabled": True,
            "window": WINDOW_SIZE,
            "above": 80,
            "severity": "HIGH",
            "alert_type": "SUSTAINED_CPU",
            "short_code": "CPU_010",
            "category": "CPU",
        },
        "spike": {
            "enabled": True,
            "delta": 40,
            "severity": "MEDIUM",
            "alert_type": "CPU_SPIKE",
            "short_code": "CPU_020",
            "category": "CPU",
        },
    },

    # ── Memory ───────────────────────────────────────────
    "memory": {
        "threshold": {
            "enabled": True,
            "tiers": [
                {"min": 95, "severity": "CRITICAL",  "short_code": "MEM_003"},
                {"min": 90, "severity": "HIGH",      "short_code": "MEM_002"},
                {"min": 80, "severity": "MEDIUM",    "short_code": "MEM_001"},
            ],
            "alert_type": "HIGH_MEMORY",
            "category": "MEMORY",
        },
        "growth_rate": {
            "enabled": True,
            "growth_threshold": 10,     # % growth across window
            "severity": "CRITICAL",
            "alert_type": "MEMORY_LEAK",
            "short_code": "MEM_010",
            "category": "MEMORY",
        },
    },

    # ── Disk ─────────────────────────────────────────────
    "disk": {
        "threshold": {
            "enabled": True,
            "tiers": [
                {"min": 98, "severity": "CRITICAL",  "short_code": "DSK_003"},
                {"min": 95, "severity": "HIGH",      "short_code": "DSK_002"},
                {"min": 90, "severity": "MEDIUM",    "short_code": "DSK_001"},
            ],
            "alert_type": "DISK_FULL",
            "category": "DISK",
        },
        "free_space": {
            "enabled": True,
            "min_free_bytes": 5 * 1024 * 1024 * 1024,   # 5 GB
            "severity": "CRITICAL",
            "alert_type": "DISK_LOW_SPACE",
            "short_code": "DSK_010",
            "category": "DISK",
        },
        "fill_rate_mb_sec": {
            "enabled": True,
            "rate_bytes_per_sec": 50 * 1024 * 1024,     # 50 MB/s sustained
            "severity": "HIGH",
            "alert_type": "DISK_FILL_RATE_MB_SEC",
            "short_code": "DSK_020",
            "category": "DISK",
        },
    },

    # ── Process ──────────────────────────────────────────
    "process": {
        "high_cpu": {
            "enabled": True,
            "tiers": [
                {"min": 90, "severity": "CRITICAL",  "short_code": "PRC_003"},
                {"min": 80, "severity": "HIGH",      "short_code": "PRC_002"},
                {"min": 70, "severity": "MEDIUM",    "short_code": "PRC_001"},
            ],
            "alert_type": "PROCESS_HIGH_CPU",
            "category": "PROCESS",
        },
    },
}