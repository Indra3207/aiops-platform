import psutil

def collect_cpu_metrics():

    cpu_usage = psutil.cpu_percent(interval=1)

    cpu_freq = None
    freq = psutil.cpu_freq()
    if freq:
        cpu_freq = freq.current

    cpu_count = psutil.cpu_count()

    load_avg = None
    try:
        load_avg = psutil.getloadavg()
    except:
        load_avg = None

    stats = psutil.cpu_stats()

    return {
        "usage_percent": cpu_usage,
        "frequency_mhz": cpu_freq,
        "core_count": cpu_count,
        "load_average": load_avg,
        "context_switches": stats.ctx_switches,
        "interrupts": stats.interrupts
    }
