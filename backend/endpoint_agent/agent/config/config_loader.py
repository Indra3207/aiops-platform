import json
import os

def load_config():
    # Get the directory where this script is located
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up two levels to find config.json in the project root
    project_root = os.path.dirname(os.path.dirname(current_dir))
    config_path = os.path.join(project_root, "config.json")

    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")

    with open(config_path, "r") as f:
        config = json.load(f)

    return config
