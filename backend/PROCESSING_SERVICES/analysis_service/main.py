#!/usr/bin/env python3
"""
Analysis Service
Entry point for the RAG + LLM Translation Service.
Consume -> Retrieve Context -> Generate LLM Translation -> Produce Final JSON
"""

import logging
import sys
import json
from processor import AnalysisProcessor
from kafka_client import AnalysisKafkaClient

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

def run_service():
    logger.info("Starting Analysis Service...")
    
    processor = AnalysisProcessor()
    kafka_client = AnalysisKafkaClient()
    
    if not kafka_client.consumer:
        logger.error("Running without Kafka. Provide mock data to test manually.")
        sys.exit(1)

    logger.info("Listening for diagnosis events...")
    
    for message in kafka_client.consume():
        try:
            diagnosis_payload = message.value
            logger.info(f"Received new diagnosis for system: {diagnosis_payload.get('system_id')}")
            
            # Run entire integrated pipeline
            final_response = processor.process_diagnosis(diagnosis_payload)
            
            # Send to next stage (Storage/API/Frontend Buffer)
            kafka_client.produce(final_response)
            
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)

if __name__ == "__main__":
    try:
        run_service()
    except KeyboardInterrupt:
        logger.info("Shutting down Analysis Service...")
        sys.exit(0)
