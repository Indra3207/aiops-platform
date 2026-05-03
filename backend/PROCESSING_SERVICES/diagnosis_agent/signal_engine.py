def analyze_signals(ctx):
    # Determine base states
    mem_high = ctx["memory_high"]
    mem_leak = ctx["memory_high"] and ctx["memory_leak"]
    disk_crit = ctx["disk_critical"]
    disk_sat = ctx["disk_critical"] and (ctx["disk_fast_fill"] or ctx["disk_risk_high"])
    cpu_high = ctx["cpu_high"]
    cpu_sat = ctx["cpu_high"] and (ctx["cpu_sustained_high"] or ctx["cpu_trend_increasing"])
    
    # Enforce Hierarchy so we don't output both pressure and saturation
    resource_signals = {
        "memory_pressure": mem_high and not mem_leak,
        "disk_pressure": disk_crit and not disk_sat,
        "cpu_stress": cpu_high and not cpu_sat
    }

    behavioral_signals = {
        "memory_leak": mem_leak,
        "disk_saturation": disk_sat,
        "cpu_saturation": cpu_sat
    }

    process_signals = {
        "process_bottleneck": ctx["process_cpu"] > 40 and (ctx["cpu_high"] or ctx["memory_high"]),
        "dominant_process_heavy": ctx["process_cpu"] > 40
    }

    return {
        "resource": resource_signals,
        "behavioral": behavioral_signals,
        "process": process_signals,
        "alerts_present": len(ctx["active_alerts"]) > 0,
        "flags_aligned": ctx["flags_aligned"]
    }