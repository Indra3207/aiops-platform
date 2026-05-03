from typing import List, Dict, Any

def identify_root_cause(inferences: List[str], feature: Dict[str, Any]) -> Dict[str, Any]:
    process_name = feature.get("process", {}).get("dominant", "unknown")
    cpu_share = feature.get("process", {}).get("cpu_share", 0)
    
    priority_map = {
        "disk_saturation": {
            "severity": "CRITICAL", 
            "resource": "disk", 
            "cause": "Disk saturation due to critical utilization",
            "impact": [
                "System slowdown due to disk saturation",
                "Write operations may fail",
                "Applications may become unresponsive"
            ]
        },
        "disk_pressure": {
            "severity": "HIGH", 
            "resource": "disk", 
            "cause": "High disk utilization detected",
            "impact": [
                "Write operations may fail",
                "Overall system delay"
            ]
        },
        "memory_leak": {
            "severity": "HIGH", 
            "resource": "memory", 
            "cause": "Memory leak pattern detected causing threshold breach",
            "impact": [
                "Application termination or OOM kill likely",
                "Reduced cache performance"
            ]
        },
        "process_bottleneck": {
            "severity": "HIGH", 
            "resource": "process", 
            "cause": f"Resource exhaustion influenced by process {process_name}",
            "impact": [
                "Application performance degradation",
                "Increased scheduler latency"
            ]
        },
        "cpu_saturation": {
            "severity": "MEDIUM", 
            "resource": "cpu", 
            "cause": "Sustained CPU exhaustion",
            "impact": [
                "System slowdown and increased latency",
                "Poor response times for concurrent services"
            ]
        },
        "memory_pressure": {
            "severity": "MEDIUM", 
            "resource": "memory", 
            "cause": "Elevated memory utilization",
            "impact": [
                "Degraded memory availability for new processes",
                "Minor swapping may occur"
            ]
        },
        "cpu_stress": {
            "severity": "MEDIUM", 
            "resource": "cpu", 
            "cause": "Elevated CPU usage",
            "impact": [
                "Minor processing delays"
            ]
        }
    }

    process_influence = f" influenced by process {process_name}" if cpu_share > 40 and process_name != "unknown" else ""

    ranked = []
    for inf in inferences:
        if inf in priority_map:
            ranked.append((inf, priority_map[inf]))

    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2}
    ranked.sort(key=lambda x: severity_order.get(x[1]["severity"], 99))

    if not ranked:
        return {
            "root_cause": "System operating normally",
            "resource": "unknown",
            "severity": "MEDIUM",
            "impact": []
        }

    primary = ranked[0][1]

    disk_val = feature.get("disk", {}).get("current", 0)
    mem_val = feature.get("memory", {}).get("current", 0)
    
    final_severity = primary["severity"]
    if final_severity == "CRITICAL" and not (disk_val > 95 or mem_val > 95 or len(ranked) >= 2):
        final_severity = "HIGH"
    elif final_severity != "CRITICAL" and (disk_val > 95 or mem_val > 95):
        final_severity = "CRITICAL"

    cause_str = primary["cause"]
    if "influenced by process" not in cause_str:
        cause_str += process_influence

    return {
        "root_cause": cause_str,
        "resource": primary["resource"],
        "severity": final_severity,
        "impact": primary["impact"]
    }

