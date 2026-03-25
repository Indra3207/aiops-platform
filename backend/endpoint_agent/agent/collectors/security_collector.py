import psutil

def collect_security_metrics():

    suspicious_processes = []
    keywords = ["miner", "crypto", "hack", "exploit", "ransomware"]

    for proc in psutil.process_iter(['name']):
        try:
            name = proc.info['name']
            if name:
                name_lower = name.lower()
                if any(kw in name_lower for kw in keywords):
                    suspicious_processes.append(name)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    return {
        "suspicious_process_count": len(suspicious_processes),
        "suspicious_processes": suspicious_processes[:10]
    }
