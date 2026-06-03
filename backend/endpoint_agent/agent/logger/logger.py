import logging
import os

def setup_logger():
    # Get project root to store logs in a consistent location
    current_dir  = os.path.dirname(os.path.abspath(__file__)) 
    project_root = os.path.dirname(os.path.dirname(current_dir)) 
    log_dir = os.path.join(project_root, "logs")   
    
    os.makedirs(log_dir, exist_ok=True) 
    
    log_file = os.path.join(log_dir, "agent.log") 

    logger = logging.getLogger("endpoint-agent")
    
    # Avoid adding handlers multiple times if setup_logger is called again 
    if logger.hasHandlers():
        return logger
        
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s"
    )

    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger
