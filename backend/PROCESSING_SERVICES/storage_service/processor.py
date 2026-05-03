def extract_metrics(data: dict):
    if not isinstance(data, dict):
        print(f"❌ Error: Expected dict but got {type(data).__name__}")
        return None

    try:
        # 🔹 Extracting nested values safely
        hardware = data.get("hardware", {})
        security = data.get("security", {})
        software = data.get("software", {})

        metrics = {
            "system_id": data.get("system_id"),
            "timestamp": data.get("timestamp"),

            "cpu_usage": hardware.get("cpu", {}).get("usage_percent"),
            "ram_percent": hardware.get("memory", {}).get("percent"),
            "disk_percent": hardware.get("disk", {}).get("usage_percent"),

            "network_sent": hardware.get("network", {}).get("bytes_sent"),
            "network_recv": hardware.get("network", {}).get("bytes_recv"),

            "process_count": software.get("process", {}).get("process_count"),

            "suspicious_process_count": security.get("suspicious_process_count"),
        }

        # 🔹 Basic validation: Ensure critical fields exist
        if not metrics["system_id"]:
            print("⚠️ Warning: Missing 'system_id' in telemetry data.")
            
        return metrics

    except Exception as e:
        print(f"❌ Processing error: {e}")
        return None