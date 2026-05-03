def apply_rules(signals):
    inferences = []

    b_sigs = signals.get("behavioral", {})
    r_sigs = signals.get("resource", {})
    p_sigs = signals.get("process", {})

    if b_sigs.get("disk_saturation"):
        inferences.append("disk_saturation")
    if r_sigs.get("disk_pressure"):
        inferences.append("disk_pressure")

    if b_sigs.get("memory_leak"):
        inferences.append("memory_leak")
    if r_sigs.get("memory_pressure"):
        inferences.append("memory_pressure")

    if b_sigs.get("cpu_saturation"):
        inferences.append("cpu_saturation")
    if r_sigs.get("cpu_stress"):
        inferences.append("cpu_stress")

    if p_sigs.get("process_bottleneck"):
        inferences.append("process_bottleneck")

    return inferences