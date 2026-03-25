import psutil

def collect_process_metrics():

    processes = []

    # Get all processes in one pass
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            pinfo = proc.info
            # Avoid processes with no data
            if pinfo['cpu_percent'] is not None and pinfo['memory_percent'] is not None:
                processes.append(pinfo)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    # Sort and take top 5 for CPU
    top_cpu = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:5]

    # Sort and take top 5 for Memory
    top_memory = sorted(processes, key=lambda x: x['memory_percent'], reverse=True)[:5]

    return {
        "process_count": len(processes),
        "top_cpu_processes": top_cpu,
        "top_memory_processes": top_memory
    }
