import time
import numpy as np
from config import WINDOW_SIZE

def compute_trend(values):
    if len(values) < 2:
        return "stable"
    slope = values[-1] - values[0]
    if slope > 5:
        return "increasing"
    elif slope < -5:
        return "decreasing"
    return "stable"

def compute_volatility(variance):
    if variance < 50:
        return "low"
    elif variance <= 150:
        return "medium"
    return "high"

def compute_features(system_id, telemetry, state_data):
    cpu_vals = list(state_data["cpu"])
    mem_vals = list(state_data["memory"])
    disk_vals = list(state_data["disk"])
    write_vals = list(state_data["write_bytes"])
    ts_vals = list(state_data["timestamps"])

    # Graceful extraction
    hardware = telemetry.get("hardware") or {}
    software = telemetry.get("software") or {}
    process_info = software.get("process") or {}
    system_info = software.get("system") or {}

    cpu_hw = hardware.get("cpu") or {}
    mem_hw = hardware.get("memory") or {}
    disk_hw = hardware.get("disk") or {}

    # L1: Snapshot
    cpu_current = cpu_vals[-1] if cpu_vals else float(cpu_hw.get("usage_percent") or 0.0)
    mem_current = mem_vals[-1] if mem_vals else float(mem_hw.get("percent") or 0.0)
    disk_current = disk_vals[-1] if disk_vals else float(disk_hw.get("percent") or 0.0)

    processes = process_info.get("top_cpu_processes") or []
    valid_procs = []
    for p in processes:
        if isinstance(p, dict):
            name = p.get("name")
            if name and str(name).strip() and name not in ["System", "System Idle Process"]:
                valid_procs.append(p)
                
    dominant_name = valid_procs[0].get("name") if valid_procs else None
    dominant = str(dominant_name).strip() if dominant_name and str(dominant_name).strip() else "unknown"
    
    # Process CPU Share Clamping (Strict 0 to 100)
    cpu_share_raw = valid_procs[0].get("cpu_percent") if valid_procs else 0.0
    try:
        cpu_share = float(cpu_share_raw)
    except (TypeError, ValueError):
        cpu_share = 0.0
    cpu_share = max(0.0, min(cpu_share, 100.0))

    # L2: Temporal
    cpu_avg = float(np.mean(cpu_vals)) if cpu_vals else 0.0
    cpu_var = float(np.var(cpu_vals)) if cpu_vals else 0.0
    cpu_trend = compute_trend(cpu_vals)
    cpu_volatility = compute_volatility(cpu_var)

    # L3: Rate & Delta Percent Only
    cpu_prev = cpu_vals[-2] if len(cpu_vals) > 1 else cpu_current
    cpu_change_rate = cpu_current - cpu_prev
    cpu_delta_percent = (cpu_change_rate / cpu_prev * 100.0) if cpu_prev > 0 else 0.0

    mem_growth = (mem_vals[-1] - mem_vals[0]) if len(mem_vals) > 1 else 0.0
    
    # Time diff in seconds
    time_diff = (ts_vals[-1] - ts_vals[0]) if len(ts_vals) > 1 else 0.0
    
    # Disk Fill Rate - Standardized Fields
    fill_rate_bytes_sec = 0.0
    disk_percent_rate = 0.0
    if len(write_vals) > 1 and time_diff > 0:
        fill_rate_bytes_sec = float(write_vals[-1] - write_vals[0]) / time_diff
        disk_percent_rate = float(disk_vals[-1] - disk_vals[0]) / time_diff

    fill_rate_mb_sec = fill_rate_bytes_sec / (1024.0 * 1024.0)

    # Mem Percent Rate (Percent / sec)
    mem_percent_rate = 0.0
    if len(mem_vals) > 1 and time_diff > 0:
        mem_percent_rate = float(mem_vals[-1] - mem_vals[0]) / time_diff

    # L4: Pattern
    cpu_spike = len(cpu_vals) > 1 and cpu_change_rate > 40
    cpu_sustained_high = all(v > 70 for v in cpu_vals) if len(cpu_vals) == WINDOW_SIZE else False
    
    # Monotonic Memory Leak (Strict increasing)
    mem_leak_pattern = False
    if len(mem_vals) == WINDOW_SIZE:
        mem_leak_pattern = all(mem_vals[i] < mem_vals[i+1] for i in range(len(mem_vals)-1))
    
    disk_risk = bool(disk_current > 95 and fill_rate_bytes_sec > 0)

    # L5: Time-Based Intelligence & Correlation
    # Time to Full (Disk reaching 100%)
    time_to_full_sec = None
    time_to_full_hr = None
    if disk_percent_rate > 0 and disk_current < 100.0:
        time_to_full_sec = (100.0 - disk_current) / disk_percent_rate
        time_to_full_hr = time_to_full_sec / 3600.0

    # Time to Critical (Memory reaching 90%)
    time_to_critical = None
    if mem_percent_rate > 0 and mem_current < 90:
        time_to_critical = (90.0 - mem_current) / mem_percent_rate

    # Flags (Strict Thresholds)
    high_cpu = bool(cpu_current > 70)
    memory_risk = bool(mem_current > 90)
    disk_critical = bool(disk_current > 95)

    # Correlation Features (Always Present)
    correlation = {}
    if high_cpu and dominant != "unknown":
        correlation["cpu_root_process"] = dominant
        
    if disk_critical and fill_rate_bytes_sec > 0:
        correlation["disk_risk_level"] = "high"

    # Context
    uptime = system_info.get("system_uptime_seconds")
    if uptime is None:
        uptime = 0
    try:
        uptime_val = int(float(uptime))
    except (TypeError, ValueError):
        uptime_val = 0
        
    system_state = "long_running" if uptime_val > 86400 else "normal"

    # Timestamp
    try:
        ts = int(float(telemetry.get("timestamp") or time.time()))
    except (TypeError, ValueError):
        ts = int(time.time())

    # Final Consistent Schema
    features = {
        "system_id": str(system_id),
        "timestamp": ts,
        "cpu": {
            "current": float(cpu_current),
            "previous": float(cpu_prev),
            "change_rate": float(cpu_change_rate),
            "delta_percent": float(cpu_delta_percent),
            "avg": float(cpu_avg),
            "trend": str(cpu_trend),
            "variance": float(cpu_var),
            "volatility": str(cpu_volatility),
            "spike": bool(cpu_spike),
            "sustained_high": bool(cpu_sustained_high)
        },
        "memory": {
            "current": float(mem_current),
            "growth_rate": float(mem_growth),
            "leak_pattern": bool(mem_leak_pattern),
            "time_to_critical": float(time_to_critical) if time_to_critical is not None else None
        },
        "disk": {
            "current": float(disk_current),
            "fill_rate_bytes_sec": float(fill_rate_bytes_sec),
            "fill_rate_mb_sec": float(fill_rate_mb_sec),
            "time_to_full_sec": float(time_to_full_sec) if time_to_full_sec is not None else None,
            "time_to_full_hr": float(time_to_full_hr) if time_to_full_hr is not None else None,
            "risk": bool(disk_risk)
        },
        "process": {
            "dominant": str(dominant),
            "cpu_share": float(cpu_share)
        },
        "correlation": correlation,
        "context": {
            "uptime": int(uptime_val),
            "system_state": str(system_state)
        },
        "flags": {
            "high_cpu": high_cpu,
            "memory_risk": memory_risk,
            "disk_critical": disk_critical
        },
        "meta": {
            "window_size": int(WINDOW_SIZE),
            "computed_at": int(time.time())
        }
    }

    return features