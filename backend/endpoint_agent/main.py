from agent.config.config_loader import load_config
from agent.scheduler.scheduler import start_scheduler
from agent.logger.logger import setup_logger


def main():

    logger = setup_logger()

    logger.info("Starting Endpoint Agent")

    try:
        config = load_config()

        logger.info(f"System ID: {config['system_id']}")

        start_scheduler(config, logger)

    except Exception as e:
        logger.error(f"Agent failed to start: {str(e)}")


if __name__ == "__main__":
    main()
