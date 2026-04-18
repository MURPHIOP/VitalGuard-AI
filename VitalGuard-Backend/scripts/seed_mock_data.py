import asyncio
from datetime import timedelta

from app.config import get_settings
from app.db.mongo import MongoManager
from app.db.repositories import AnomalyRepository
from app.utils.ids import new_event_id
from app.utils.time import now_utc


async def main() -> None:
    settings = get_settings()
    mongo = MongoManager(settings)
    await mongo.connect()

    anomaly_repo = AnomalyRepository(mongo.db())

    now = now_utc()
    docs = [
        {
            "id": new_event_id("evt"),
            "roomId": "401",
            "type": "FALL",
            "timestamp": now - timedelta(minutes=6),
            "confidence": 0.94,
            "feedback": "PENDING",
        },
        {
            "id": new_event_id("evt"),
            "roomId": "402",
            "type": "FALL",
            "timestamp": now - timedelta(minutes=34),
            "confidence": 0.89,
            "feedback": "FALSE_ALARM",
        },
    ]

    for doc in docs:
        await anomaly_repo.insert_anomaly(doc)

    await mongo.disconnect()
    print("Mock anomaly records inserted")


if __name__ == "__main__":
    asyncio.run(main())
