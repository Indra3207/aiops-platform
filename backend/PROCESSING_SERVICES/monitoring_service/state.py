"""
Monitoring Service — State Manager
====================================
Manages sliding windows, alert lifecycle (ACTIVE → RESOLVED),
deduplication, rate tracking, and per-rule cooldowns.
"""

import time
import logging
from collections import defaultdict, deque
from config import WINDOW_SIZE, ALERT_COOLDOWN_SEC

logger = logging.getLogger("monitoring.state")

# ─────────────────── Sliding Windows ──────────────────────────
# metric_windows[system_id][metric] → deque of recent values
metric_windows: dict = defaultdict(
    lambda: defaultdict(lambda: deque(maxlen=WINDOW_SIZE))
)

# ─────────────────── Timestamped Values (for rate calc) ───────
# rate_tracker[system_id][metric] → deque of (timestamp, value)
rate_tracker: dict = defaultdict(
    lambda: defaultdict(lambda: deque(maxlen=WINDOW_SIZE))
)

# ─────────────────── Alert State (ACTIVE / RESOLVED) ──────────
# active_alerts[system_id:alert_type] → True while condition persists
active_alerts: dict = {}

# ─────────────────── Cooldown Tracker ─────────────────────────
# alert_last_sent[system_id:alert_type] → epoch when last emitted
alert_last_sent: dict = {}


# ═══════════════════ Window Operations ════════════════════════

def update_window(system_id: str, metric: str, value: float) -> None:
    """Append the latest value to the sliding window."""
    metric_windows[system_id][metric].append(value)


def get_window(system_id: str, metric: str) -> list[float]:
    """Return a copy of the current sliding window."""
    return list(metric_windows[system_id][metric])


# ═══════════════════ Rate Tracking ════════════════════════════

def update_rate_tracker(system_id: str, metric: str, value: float) -> None:
    """Store a timestamped (epoch, value) pair for rate calculations."""
    rate_tracker[system_id][metric].append((time.time(), value))


def get_rate(system_id: str, metric: str) -> float | None:
    """
    Compute the rate of change (units / second) over the stored window.
    Returns None if fewer than 2 data points are available.
    """
    points = rate_tracker[system_id][metric]
    if len(points) < 2:
        return None

    t_old, v_old = points[0]
    t_new, v_new = points[-1]
    dt = t_new - t_old
    if dt <= 0:
        return None

    return (v_new - v_old) / dt


# ═══════════════════ Alert Lifecycle ══════════════════════════

def is_alert_active(system_id: str, alert_type: str) -> bool:
    """Check whether an alert is currently in ACTIVE state."""
    key = f"{system_id}:{alert_type}"
    return active_alerts.get(key, False)


def set_alert_active(system_id: str, alert_type: str) -> None:
    """Mark an alert as ACTIVE (condition currently triggered)."""
    key = f"{system_id}:{alert_type}"
    active_alerts[key] = True
    logger.debug("Alert ACTIVE: %s", key)


def set_alert_resolved(system_id: str, alert_type: str) -> None:
    """Mark an alert as RESOLVED (condition no longer triggered)."""
    key = f"{system_id}:{alert_type}"
    if key in active_alerts:
        del active_alerts[key]
        logger.debug("Alert RESOLVED: %s", key)


def get_all_active_alert_keys() -> set[str]:
    """Return the set of all currently active system_id:alert_type keys."""
    return set(active_alerts.keys())


# ═══════════════════ Cooldown ═════════════════════════════════

def is_cooldown_passed(system_id: str, alert_type: str,
                       cooldown: int | None = None) -> bool:
    """
    Returns True if the per-rule (or global) cooldown has elapsed.
    When True, updates the last-sent timestamp.
    """
    key = f"{system_id}:{alert_type}"
    now = time.time()
    cd = cooldown if cooldown is not None else ALERT_COOLDOWN_SEC

    if key in alert_last_sent:
        if now - alert_last_sent[key] < cd:
            return False

    alert_last_sent[key] = now
    return True