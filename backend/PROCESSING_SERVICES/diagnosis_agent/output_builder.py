def build_output(feature, root, confidence, signals):
    severity_to_priority = {
        "CRITICAL": 1,
        "HIGH": 2,
        "MEDIUM": 3
    }
    
    severity = root["severity"]
    
    if severity == "CRITICAL":
        stage = "critical"
    elif severity == "MEDIUM" and not signals.get("alerts_present"):
        stage = "early_warning"
    else:
        stage = "active"
    
    collapsed_signals = {**signals.get("resource", {}), **signals.get("behavioral", {}), **signals.get("process", {})}

    priority = severity_to_priority.get(severity, 3)

    return {
        "system_id": feature.get("system_id", "unknown"),
        "timestamp": feature.get("timestamp", 0),
        "diagnosis": {
            "root_cause": root["root_cause"],
            "primary_resource": root["resource"],
            "severity": severity,
            "confidence": round(confidence, 2),
            "category": "resource_issue" if root["resource"] in ["cpu", "memory", "disk"] else "process_issue",
            "stage": stage,
            "impact": root.get("impact", [])
        },
        "signals": collapsed_signals,
        "evidence": {
            "cpu": feature.get("cpu", {}).get("current", 0),
            "memory": feature.get("memory", {}).get("current", 0),
            "disk": feature.get("disk", {}).get("current", 0),
            "process": feature.get("process", {}).get("dominant", "unknown")
        },
        "priority": priority,
        "meta": {
            "generated_at": feature.get("meta", {}).get("computed_at", feature.get("timestamp", 0)),
            "engine_version": "v1"
        }
    }
