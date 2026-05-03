import asyncio
import json
from processor import process_event

class MockKafka:
    async def produce(self, topic, data):
        print(f"PRODUCED TO {topic}:")
        print(json.dumps(data, indent=2))

async def main():
    feature_data = {
      "system_id": "SYS-001",
      "timestamp": 1774905258,
      "cpu": {
        "current": 53.9,
        "previous": 84.5,
        "change_rate": -30.6,
        "delta_percent": -36.21301775147929,
        "avg": 75.5,
        "trend": "decreasing",
        "variance": 235.44,
        "volatility": "high",
        "spike": False,
        "sustained_high": False
      },
      "memory": {
        "current": 94.6,
        "growth_rate": -3.0,
        "leak_pattern": False,
        "time_to_critical": None
      },
      "disk": {
        "current": 98.7,
        "fill_rate_bytes_sec": 27148764.81,
        "fill_rate_mb_sec": 25.89,
        "time_to_full_sec": None,
        "time_to_full_hr": None,
        "risk": True
      },
      "process": {
        "dominant": "MemCompression",
        "cpu_share": 50.1
      },
      "correlation": {
        "disk_risk_level": "high"
      },
      "context": {
        "uptime": 274744,
        "system_state": "long_running"
      },
      "flags": {
        "high_cpu": False,
        "memory_risk": True,
        "disk_critical": True
      },
      "meta": {
        "window_size": 5,
        "computed_at": 1774905260
      }
    }
    
    kafka = MockKafka()
    await process_event(feature_data, kafka)

if __name__ == "__main__":
    asyncio.run(main())
