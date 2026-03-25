import requests
from agent.buffer.telemetry_buffer import save_to_buffer


def send_telemetry(telemetry, config, logger, buffer_on_failure=True):

    server_url = config["telemetry_api"]

    retries = 3

    for attempt in range(retries):

        try:

            response = requests.post(server_url, json=telemetry, timeout=5)

            if response.status_code == 200:
                return True

        except Exception as e:

            logger.warning(f"Attempt {attempt+1} failed: {str(e)}")

    if buffer_on_failure:
        logger.error("All retries failed. Saving telemetry to buffer")
        save_to_buffer(telemetry)

    return False
