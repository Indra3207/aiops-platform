from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URI, DB_NAME

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

raw_collection = db["raw_telemetry"]
metrics_collection = db["system_metrics"]

async def check_db_connection():
    try:
        # The ismaster command is cheap and does not require auth.
        await client.admin.command('ismaster')
        return True
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False