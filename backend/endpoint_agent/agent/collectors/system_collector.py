import psutil
import time

def collect_system_metrics():

    boot_time = psutil.boot_time()

    uptime = int(time.time() - boot_time)

    return {
        "boot_time": boot_time,
        "system_uptime_seconds": uptime
    }
