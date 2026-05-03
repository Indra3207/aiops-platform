from collections import defaultdict, deque
import time
from config import WINDOW_SIZE

state = defaultdict(lambda: {
    "cpu": deque(maxlen=WINDOW_SIZE),
    "memory": deque(maxlen=WINDOW_SIZE),
    "disk": deque(maxlen=WINDOW_SIZE),
    "write_bytes": deque(maxlen=WINDOW_SIZE),
    "timestamps": deque(maxlen=WINDOW_SIZE),
})

def update_state(system_id, telemetry):
    hardware = telemetry.get("hardware") or {}
    cpu_info = hardware.get("cpu") or {}
    mem_info = hardware.get("memory") or {}
    disk_info = hardware.get("disk") or {}
    
    try:
        cpu = float(cpu_info.get("usage_percent") or 0.0)
    except (TypeError, ValueError):
        cpu = 0.0
        
    try:
        memory = float(mem_info.get("percent") or 0.0)
    except (TypeError, ValueError):
        memory = 0.0
        
    try:
        disk = float(disk_info.get("percent") or 0.0)
    except (TypeError, ValueError):
        disk = 0.0
        
    try:
        write_bytes = float(disk_info.get("write_bytes") or 0.0)
    except (TypeError, ValueError):
        write_bytes = 0.0
        
    try:
        timestamp = float(telemetry.get("timestamp") or time.time())
    except (TypeError, ValueError):
        timestamp = time.time()

    state[system_id]["cpu"].append(cpu)
    state[system_id]["memory"].append(memory)
    state[system_id]["disk"].append(disk)
    state[system_id]["write_bytes"].append(write_bytes)
    state[system_id]["timestamps"].append(timestamp)

def get_state(system_id):
    return state[system_id]