from datetime import datetime
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase


def _sort_by_timestamp(items: list[dict[str, Any]], key: str = "server_ts") -> list[dict[str, Any]]:
    return sorted(items, key=lambda item: item.get(key) or datetime.min, reverse=True)


class TelemetryRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db.telemetry_readings

    async def insert_reading(self, doc: dict[str, Any]) -> None:
        await self._col.insert_one(doc)

    async def get_recent(self, room_id: str, limit: int = 120) -> list[dict[str, Any]]:
        cursor = self._col.find({"roomId": room_id}).sort("server_ts", -1).limit(limit)
        items = await cursor.to_list(length=limit)
        return list(reversed(items))


class InMemoryTelemetryRepository:
    def __init__(self) -> None:
        self._items: list[dict[str, Any]] = []

    async def insert_reading(self, doc: dict[str, Any]) -> None:
        self._items.append(dict(doc))

    async def get_recent(self, room_id: str, limit: int = 120) -> list[dict[str, Any]]:
        items = [item for item in self._items if item.get("roomId") == room_id]
        return list(reversed(_sort_by_timestamp(items, key="server_ts")[:limit]))


class AnomalyRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db.anomalies

    async def insert_anomaly(self, doc: dict[str, Any]) -> None:
        await self._col.insert_one(doc)

    async def get_history(self, limit: int = 100) -> list[dict[str, Any]]:
        cursor = self._col.find({}).sort("timestamp", -1).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_history_by_room(self, room_id: str, limit: int = 100) -> list[dict[str, Any]]:
        cursor = self._col.find({"roomId": room_id}).sort("timestamp", -1).limit(limit)
        return await cursor.to_list(length=limit)

    async def latest_pending_fall(self, room_id: str, lookback: int = 10) -> Optional[dict[str, Any]]:
        cursor = (
            self._col.find({"roomId": room_id, "type": "FALL", "feedback": "PENDING"})
            .sort("timestamp", -1)
            .limit(lookback)
        )
        items = await cursor.to_list(length=lookback)
        return items[0] if items else None

    async def update_feedback(self, anomaly_id: str, feedback: str) -> None:
        await self._col.update_one({"id": anomaly_id}, {"$set": {"feedback": feedback, "feedbackUpdatedAt": datetime.utcnow()}})


class InMemoryAnomalyRepository:
    def __init__(self) -> None:
        self._items: list[dict[str, Any]] = []

    async def insert_anomaly(self, doc: dict[str, Any]) -> None:
        self._items.append(dict(doc))

    async def get_history(self, limit: int = 100) -> list[dict[str, Any]]:
        return _sort_by_timestamp(self._items, key="timestamp")[:limit]

    async def get_history_by_room(self, room_id: str, limit: int = 100) -> list[dict[str, Any]]:
        items = [item for item in self._items if item.get("roomId") == room_id]
        return _sort_by_timestamp(items, key="timestamp")[:limit]

    async def latest_pending_fall(self, room_id: str, lookback: int = 10) -> Optional[dict[str, Any]]:
        items = [
            item
            for item in self._items
            if item.get("roomId") == room_id and item.get("type") == "FALL" and item.get("feedback") == "PENDING"
        ]
        items = _sort_by_timestamp(items, key="timestamp")
        return items[0] if items else None

    async def update_feedback(self, anomaly_id: str, feedback: str) -> None:
        for item in self._items:
            if item.get("id") == anomaly_id:
                item["feedback"] = feedback
                item["feedbackUpdatedAt"] = datetime.utcnow()
                break


class FeedbackRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db.feedback

    async def insert_feedback(self, doc: dict[str, Any]) -> None:
        await self._col.insert_one(doc)


class InMemoryFeedbackRepository:
    def __init__(self) -> None:
        self._items: list[dict[str, Any]] = []

    async def insert_feedback(self, doc: dict[str, Any]) -> None:
        self._items.append(dict(doc))


class RoomSnapshotRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db.room_state_snapshots

    async def upsert_snapshot(self, room_id: str, doc: dict[str, Any]) -> None:
        await self._col.update_one({"roomId": room_id}, {"$set": doc}, upsert=True)

    async def get_all(self) -> list[dict[str, Any]]:
        cursor = self._col.find({})
        return await cursor.to_list(length=1000)


class InMemoryRoomSnapshotRepository:
    def __init__(self) -> None:
        self._items: dict[str, dict[str, Any]] = {}

    async def upsert_snapshot(self, room_id: str, doc: dict[str, Any]) -> None:
        self._items[room_id] = dict(doc)

    async def get_all(self) -> list[dict[str, Any]]:
        return list(self._items.values())
