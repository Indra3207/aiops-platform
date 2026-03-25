import requests
import time


def send_heartbeat(config, logger):

    heartbeat_url = config["heartbeat_api"]
    retries = 3

    for attempt in range(retries):
        try:
            data = {
                "system_id": config["system_id"],
                "status": "agent_alive",
                "timestamp": int(time.time())
            }

            response = requests.post(heartbeat_url, json=data, timeout=3)
            
            if response.status_code == 200:
                logger.info("Heartbeat sent")
                return True
            else:
                logger.warning(f"Heartbeat attempt {attempt+1} failed with status: {response.status_code}")

        except Exception as e:
            logger.warning(f"Heartbeat attempt {attempt+1} failed: {str(e)}")
            
        if attempt < retries - 1:
            time.sleep(1)

    logger.error("All heartbeat retries failed")
    return False
