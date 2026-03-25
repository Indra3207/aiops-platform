from agent.collectors.cpu_collector import collect_cpu_metrics
from agent.collectors.memory_collector import collect_memory_metrics
from agent.collectors.disk_collector import collect_disk_metrics
from agent.collectors.network_collector import collect_network_metrics
from agent.collectors.process_collector import collect_process_metrics
from agent.collectors.system_collector import collect_system_metrics
from agent.collectors.security_collector import collect_security_metrics

import socket
import platform
import time


def build_telemetry(system_id):
    # If the whole config was passed by mistake, extract system_id
    if isinstance(system_id, dict):
        system_id = system_id.get("system_id", "UNKNOWN")

    telemetry = {

        "metadata": {
            "system_id": system_id,
            "hostname": socket.gethostname(),
            "os": platform.system(),
            "timestamp": int(time.time())
        },

        "hardware": {
            "cpu": collect_cpu_metrics(),
            "memory": collect_memory_metrics(),
            "disk": collect_disk_metrics(),
            "network": collect_network_metrics()
        },

        "software": {
            "process": collect_process_metrics(),
            "system": collect_system_metrics()
        },

        "security": collect_security_metrics()

    }

    return telemetry
