from motor.motor_asyncio import AsyncIOMotorDatabase


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.telemetry_readings.create_index([("roomId", 1), ("server_ts", -1)])
    await db.telemetry_readings.create_index([("server_ts", -1)])

    await db.anomalies.create_index([("roomId", 1), ("timestamp", -1)])
    await db.anomalies.create_index([("timestamp", -1)])

    await db.feedback.create_index([("roomId", 1), ("timestamp", -1)])
    await db.feedback.create_index([("anomalyId", 1)])
