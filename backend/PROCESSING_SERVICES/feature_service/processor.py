from state import update_state, get_state
from feature_engine import compute_features


async def process_event(event, kafka):
    system_id = event.get("system_id")
    if not system_id:
        print("Warning: Missing system_id in telemetry event.")
        return

    try:
        update_state(system_id, event)
        state_data = get_state(system_id)
        
        features = compute_features(system_id, event, state_data)
        
        print(f"✅ Processed {system_id} -> Pushing to Kafka...")
        
        await kafka.produce(features)
    except Exception as e:
        print(f"Error processing event for {system_id}: {e}")