import json
import os

# Get absolute path for the buffer file
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
BUFFER_FILE = os.path.join(project_root, "buffer", "telemetry_buffer.json")


def save_to_buffer(telemetry):

    os.makedirs(os.path.dirname(BUFFER_FILE), exist_ok=True)

    data = []
    if os.path.exists(BUFFER_FILE):
        try:
            with open(BUFFER_FILE, "r") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            data = []

    data.append(telemetry)

    with open(BUFFER_FILE, "w") as f:
        json.dump(data, f)


def load_buffer():

    if not os.path.exists(BUFFER_FILE):
        return []

    try:
        with open(BUFFER_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def clear_buffer():

    if os.path.exists(BUFFER_FILE):
        with open(BUFFER_FILE, "w") as f:
            json.dump([], f)
