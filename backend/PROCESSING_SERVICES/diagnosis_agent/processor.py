import time
from context_builder import build_context
from signal_engine import analyze_signals
from rule_engine import apply_rules
from inference_engine import identify_root_cause
from confidence_engine import compute_confidence
from output_builder import build_output


async def process_event(feature_data, kafka):
    try:
        # Check if alerts are coming through. Could be separate payload or injected elsewhere.
        # We assume no alerts by default here for safety.
        mock_alerts = [] 

        ctx = build_context(feature_data, alerts=mock_alerts)
        signals = analyze_signals(ctx)
        inferences = apply_rules(signals)
        root = identify_root_cause(inferences, feature_data)
        confidence = compute_confidence(inferences, signals, root["severity"])

        output = build_output(feature_data, root, confidence, signals)

        print(f"DIAGNOSIS [{output['system_id']}]: {output['diagnosis']['root_cause']} ({output['diagnosis']['severity']})")

        await kafka.produce("analysis-stream", output)
    except Exception as e:
        print(f"Error processing event: {e}")
        # Safe fallback
        fallback = {
            "system_id": feature_data.get("system_id", "unknown"),
            "timestamp": int(time.time()),
            "diagnosis": {
                "root_cause": "Processing Failure",
                "primary_resource": "unknown",
                "severity": "MEDIUM",
                "confidence": 0.0,
                "category": "system_error",
                "stage": "active",
                "impact": []
            },
            "signals": {},
            "evidence": {},
            "priority": 3,
            "meta": {
                "generated_at": int(time.time()),
                "engine_version": "v1"
            }
        }
        await kafka.produce("analysis-stream", fallback)