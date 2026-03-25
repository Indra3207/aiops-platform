import time

from agent.telemetry.telemetry_builder import build_telemetry
from agent.client.api_client import send_telemetry
from agent.buffer.telemetry_buffer import load_buffer, clear_buffer, save_to_buffer
from agent.heartbeat.heartbeat import send_heartbeat


def start_scheduler(config, logger):

    interval = config.get("collection_interval", 60)
    system_id = config.get("system_id", "UNKNOWN")

    logger.info(f"Telemetry interval set to {interval} seconds")

    while True:

        try:

            logger.info("Starting telemetry cycle")

            # 1. Send heartbeat
            send_heartbeat(config, logger)

            # 2. Process buffered telemetry
            buffered_data = load_buffer()

            if buffered_data:
                logger.info(f"Found {len(buffered_data)} buffered telemetry items")
                failed_to_send = []
                
                # Clear buffer before trying to send to avoid duplication if we crash
                clear_buffer()

                for item in buffered_data:
                    try:
                        # Disable automatic buffering on failure here, we'll handle it manually
                        success = send_telemetry(item, config, logger, buffer_on_failure=False)
                        if not success:
                            failed_to_send.append(item)
                    except Exception as e:
                        logger.warning(f"Error processing buffered item: {str(e)}")
                        failed_to_send.append(item)

                if failed_to_send:
                    logger.warning(f"Re-buffering {len(failed_to_send)} items that failed to send")
                    for item in failed_to_send:
                        save_to_buffer(item)
                else:
                    logger.info("All buffered telemetry sent successfully")

            # 3. Collect fresh telemetry
            # Pass system_id string, not the whole config dict
            telemetry = build_telemetry(system_id)
            logger.info("Telemetry collected successfully")

            # 4. Send telemetry to server
            # Fresh telemetry SHOULD be buffered if it fails
            send_telemetry(telemetry, config, logger, buffer_on_failure=True)

        except Exception as e:
            logger.error(f"Telemetry cycle failed: {str(e)}")

        # 5. Wait for next cycle
        time.sleep(interval)
