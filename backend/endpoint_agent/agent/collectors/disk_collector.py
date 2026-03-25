import psutil

def collect_disk_metrics():
    disk = psutil.disk_usage('/')

    io = psutil.disk_io_counters()

    return {
        "total": disk.total,
        "used": disk.used,
        "free": disk.free,
        "percent": disk.percent,
        "read_bytes": io.read_bytes if io else None,
        "write_bytes": io.write_bytes if io else None
    }
