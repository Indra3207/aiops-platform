"""
Monitoring Service — Rule Engine
==================================
Config-driven, modular rule evaluation.  Every rule reads its thresholds
from RULES_CONFIG so behaviour can be changed without touching code.

Rule types:
  • threshold   – tiered severity (MEDIUM → HIGH → CRITICAL)
  • sustained   – metric above limit for N consecutive events
  • spike       – sudden delta between consecutive values
  • growth_rate – % growth across the sliding window
  • free_space  – absolute bytes remaining (disk)
  • fill_rate_mb_sec   – bytes/sec consumption rate (disk)
  • process     – per-process CPU with OS-process filtering
"""

import logging

from models import Alert
from config import RULES_CONFIG, IGNORED_PROCESSES
from state import (
    update_window,
    get_window,
    update_rate_tracker,
    get_rate,
)

logger = logging.getLogger("monitoring.rules")


# ═══════════════════ Helpers ══════════════════════════════════

def _confidence(value: float, threshold: float | None, pattern: str) -> float:
    """
    Rule-based confidence score.
    - Threshold rules: min(1.0, (value - threshold) / threshold)
    - Spike/Rate rules: magnitude-based normalization
    """
    if threshold is None or threshold <= 0:
        return 1.0
        
    thresh: float = 1.0 if threshold is None else float(threshold)
        
    if pattern == "threshold":
        conf = (value - thresh) / thresh
        val = min(1.0, max(0.2, conf))
        return float(f"{val:.2f}")
    
    elif pattern == "spike":
        # normalize based on delta magnitude vs threshold
        conf = (value - thresh) / thresh
        val = min(1.0, max(0.2, conf))
        return float(f"{val:.2f}")
    
    elif pattern == "rate":
        # normalize based on rate magnitude vs threshold
        conf = (value - thresh) / thresh
        val = min(1.0, max(0.2, conf))
        return float(f"{val:.2f}")
        
    return 1.0


def _match_tier(value: float, tiers: list[dict]) -> dict | None:
    """Walk tiers HIGH→LOW and return the first matching tier."""
    for tier in tiers:
        if value >= tier["min"]:
            return tier
    return None


# ═══════════════════ Individual Rule Evaluators ═══════════════

def _eval_threshold(system_id: str, metric_name: str, value: float,
                    cfg: dict, alerts: list) -> None:
    """Tiered threshold rule."""
    if not cfg.get("enabled"):
        return

    tier = _match_tier(value, cfg["tiers"])
    if tier is None:
        return

    threshold = tier["min"]
    resource = cfg.get("category", "GENERAL").lower()
    
    alerts.append(Alert.create(
        system_id=system_id,
        alert_type=cfg["alert_type"],
        severity=tier["severity"],
        metric=metric_name,
        value=value,
        threshold=threshold,
        message=f"{metric_name.upper()} usage at {value}% (threshold {threshold}%)",
        category=cfg.get("category", "GENERAL"),
        short_code=tier.get("short_code", "GEN_000"),
        confidence=_confidence(value, threshold, "threshold"),
        tags={
            "resource": resource,
            "pattern": "threshold",
            "type": "capacity"
        }
    ))


def _eval_sustained(system_id: str, metric_name: str, value: float,
                     cfg: dict, alerts: list) -> None:
    """Sustained-condition rule (Always HIGH severity)."""
    if not cfg.get("enabled"):
        return

    window = get_window(system_id, metric_name)
    required = cfg.get("window", 5)
    above = cfg["above"]

    if len(window) >= required and all(v > above for v in window[-required:]):
        resource = cfg.get("category", "GENERAL").lower()
        alerts.append(Alert.create(
            system_id=system_id,
            alert_type=cfg["alert_type"],
            severity="HIGH",  # Fixed requirement: Sustained condition -> HIGH
            metric=metric_name,
            value=value,
            threshold=above,
            message=f"{metric_name.upper()} sustained above {above}% for {required} events",
            category=cfg.get("category", "GENERAL"),
            short_code=cfg.get("short_code", "GEN_000"),
            confidence=0.8,
            tags={
                "resource": resource,
                "pattern": "sustained",
                "type": "performance"
            }
        ))


def _eval_spike(system_id: str, metric_name: str, value: float,
                cfg: dict, alerts: list) -> None:
    """Spike detection (MEDIUM severity)."""
    if not cfg.get("enabled"):
        return

    window = get_window(system_id, metric_name)
    if len(window) < 2:
        return

    delta = window[-1] - window[-2]
    if delta > cfg["delta"]:
        resource = cfg.get("category", "GENERAL").lower()
        alerts.append(Alert.create(
            system_id=system_id,
            alert_type=cfg["alert_type"],
            severity="MEDIUM", # Fixed requirement: Spike -> MEDIUM
            metric=metric_name,
            value=delta, # use delta for spike value
            threshold=cfg["delta"],
            message=f"{metric_name.upper()} spike detected: +{delta:.1f}% in one event",
            category=cfg.get("category", "GENERAL"),
            short_code=cfg.get("short_code", "GEN_000"),
            confidence=_confidence(delta, cfg["delta"], "spike"),
            tags={
                "resource": resource,
                "pattern": "spike",
                "type": "performance"
            }
        ))


def _eval_growth_rate(system_id: str, metric_name: str, value: float,
                      cfg: dict, alerts: list) -> None:
    """Growth rate (Memory Leak -> CRITICAL)."""
    if not cfg.get("enabled"):
        return

    window = get_window(system_id, metric_name)
    if len(window) < 2:
        return

    growth = window[-1] - window[0]
    if growth > cfg["growth_threshold"]:
        resource = cfg.get("category", "GENERAL").lower()
        alerts.append(Alert.create(
            system_id=system_id,
            alert_type=cfg["alert_type"],
            severity="CRITICAL", # Fixed requirement: Critical resource leak
            metric=metric_name,
            value=growth,
            threshold=cfg["growth_threshold"],
            message=f"{metric_name.upper()} grew {growth:.1f}% across window — possible leak",
            category=cfg.get("category", "GENERAL"),
            short_code=cfg.get("short_code", "GEN_000"),
            confidence=_confidence(growth, cfg["growth_threshold"], "rate"),
            tags={
                "resource": resource,
                "pattern": "rate",
                "type": "performance"
            }
        ))


def _eval_free_space(system_id: str, free_bytes: float,
                     cfg: dict, alerts: list) -> None:
    """Absolute free-space rule."""
    if not cfg.get("enabled"):
        return

    if free_bytes < cfg["min_free_bytes"]:
        gb_free = free_bytes / (1024 ** 3)
        gb_limit = cfg["min_free_bytes"] / (1024 ** 3)
        
        # calculate confidence
        deficit = cfg["min_free_bytes"] - free_bytes
        conf = _confidence(deficit, cfg["min_free_bytes"] * 0.1, "threshold")  # normalize based on 10% tolerance

        alerts.append(Alert.create(
            system_id=system_id,
            alert_type=cfg["alert_type"],
            severity="CRITICAL", # Absolute low space -> CRITICAL
            metric="disk_free",
            value=round(gb_free, 2),
            threshold=round(gb_limit, 2),
            message=f"Disk free space critically low: {gb_free:.2f} GB (limit {gb_limit:.0f} GB)",
            category=cfg.get("category", "DISK"),
            short_code=cfg.get("short_code", "DSK_010"),
            confidence=conf,
            tags={
                "resource": "disk",
                "pattern": "threshold",
                "type": "capacity"
            }
        ))


def _eval_fill_rate_mb_sec(system_id: str, cfg: dict, alerts: list) -> None:
    """Disk fill-rate rule."""
    if not cfg.get("enabled"):
        return

    rate = get_rate(system_id, "disk_free")
    if rate is None:
        return

    consumption_rate = -rate
    if consumption_rate > cfg["rate_bytes_per_sec"]:
        mb_sec = consumption_rate / (1024 ** 2)
        alerts.append(Alert.create(
            system_id=system_id,
            alert_type=cfg["alert_type"],
            severity="HIGH",
            metric="disk_fill_rate_mb_sec",
            value=float(f"{mb_sec:.2f}"),
            threshold=float(f"{(cfg['rate_bytes_per_sec'] / (1024 ** 2)):.2f}"),
            message=f"Disk filling at {mb_sec:.1f} MB/s",
            category=cfg.get("category", "DISK"),
            short_code=cfg.get("short_code", "DSK_020"),
            confidence=_confidence(consumption_rate, cfg["rate_bytes_per_sec"], "rate"),
            tags={
                "resource": "disk",
                "pattern": "rate",
                "type": "capacity"
            }
        ))


# ═══════════════════ Process Rules ════════════════════════════

def _is_ignored_process(name: str) -> bool:
    """Check if a process should be excluded from alerting."""
    return name.lower().strip() in IGNORED_PROCESSES


def _eval_processes(system_id: str, processes: list[dict],
                    cfg: dict, alerts: list) -> None:
    """Per-process CPU rule with blacklist filtering."""
    if not cfg.get("enabled"):
        return

    for proc in processes:
        name = proc.get("name", "")
        cpu = proc.get("cpu_percent", 0)

        if _is_ignored_process(name):
            continue

        tier = _match_tier(cpu, cfg["tiers"])
        if tier is None:
            continue

        alerts.append(Alert.create(
            system_id=system_id,
            alert_type=cfg["alert_type"],
            severity=tier["severity"],
            metric="process_cpu",
            value=cpu,
            threshold=tier["min"],
            message=f"Process '{name}' CPU at {cpu:.1f}% (threshold {tier['min']}%)",
            category=cfg.get("category", "PROCESS"),
            short_code=tier.get("short_code", "PRC_000"),
            confidence=_confidence(cpu, tier["min"], "threshold"),
            tags={
                "resource": "process",
                "pattern": "threshold",
                "type": "performance",
                "process_name": name
            }
        ))


# ═══════════════════ Main Evaluator ═══════════════════════════

def evaluate(system_id: str, telemetry: dict) -> list[Alert]:
    """
    Evaluate all rules and suppress lower-severity alerts in the same category.
    """
    raw_alerts: list[Alert] = []

    try:
        hw = telemetry["hardware"]
        cpu = hw["cpu"]["usage_percent"]
        memory = hw["memory"]["percent"]
        disk_pct = hw["disk"]["percent"]
        disk_free = hw["disk"].get("free", 0)
    except (KeyError, TypeError) as exc:
        logger.error("Malformed telemetry payload: %s", exc)
        return []

    # ── Update state ──────────────────────────────────────────
    update_window(system_id, "cpu", cpu)
    update_window(system_id, "memory", memory)
    update_window(system_id, "disk", disk_pct)
    update_rate_tracker(system_id, "disk_free", disk_free)

    # ── Run all rules ─────────────────────────────────────────
    cpu_cfg = RULES_CONFIG.get("cpu", {})
    _eval_threshold(system_id, "cpu", cpu, cpu_cfg.get("threshold", {}), raw_alerts)
    _eval_sustained(system_id, "cpu", cpu, cpu_cfg.get("sustained", {}), raw_alerts)
    _eval_spike(system_id, "cpu", cpu, cpu_cfg.get("spike", {}), raw_alerts)

    mem_cfg = RULES_CONFIG.get("memory", {})
    _eval_threshold(system_id, "memory", memory, mem_cfg.get("threshold", {}), raw_alerts)
    _eval_growth_rate(system_id, "memory", memory, mem_cfg.get("growth_rate", {}), raw_alerts)

    dsk_cfg = RULES_CONFIG.get("disk", {})
    _eval_threshold(system_id, "disk", disk_pct, dsk_cfg.get("threshold", {}), raw_alerts)
    _eval_free_space(system_id, disk_free, dsk_cfg.get("free_space", {}), raw_alerts)
    _eval_fill_rate_mb_sec(system_id, dsk_cfg.get("fill_rate_mb_sec", {}), raw_alerts)

    try:
        processes = telemetry["software"]["process"]["top_cpu_processes"]
        proc_cfg = RULES_CONFIG.get("process", {})
        _eval_processes(system_id, processes, proc_cfg.get("high_cpu", {}), raw_alerts)
    except (KeyError, TypeError) as exc:
        pass

    # ── Alert Suppression Logic ───────────────────────────────
    # "If higher severity alert exists -> suppress lower severity same category"
    # Categories: CPU, MEMORY, DISK, PROCESS
    
    category_best: dict[str, Alert] = {}
    
    for alert in raw_alerts:
        cat = alert.category
        if cat not in category_best:
            category_best[cat] = alert
        else:
            # priority 1 is CRITICAL (highest), 5 is INFO
            if alert.priority < category_best[cat].priority:
                category_best[cat] = alert
                
    final_alerts = list(category_best.values())
    
    logger.debug("System %s: %d alerts triggered (%d suppressed)", 
                 system_id, len(final_alerts), len(raw_alerts) - len(final_alerts))
                 
    return final_alerts
