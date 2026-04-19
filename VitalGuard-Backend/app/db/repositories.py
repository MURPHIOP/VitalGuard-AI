from datetime import datetime
from typing import Any, Optional
from typing import Protocol


class TelemetryRepository(Protocol):
    async def insert_reading(self, doc: dict[str, Any]) -> None: ...

    async def get_recent(self, room_id: str, limit: int = 120) -> list[dict[str, Any]]: ...


class AnomalyRepository(Protocol):
    async def insert_anomaly(self, doc: dict[str, Any]) -> None: ...

    async def get_history(self, limit: int = 100) -> list[dict[str, Any]]: ...

    async def get_history_by_room(self, room_id: str, limit: int = 100) -> list[dict[str, Any]]: ...

    async def latest_pending_fall(self, room_id: str, lookback: int = 10) -> Optional[dict[str, Any]]: ...

    async def update_feedback(self, anomaly_id: str, feedback: str) -> None: ...


class FeedbackRepository(Protocol):
    async def insert_feedback(self, doc: dict[str, Any]) -> None: ...


class RoomSnapshotRepository(Protocol):
    async def upsert_snapshot(self, room_id: str, doc: dict[str, Any]) -> None: ...

    async def get_all(self) -> list[dict[str, Any]]: ...


def _sort_by_timestamp(items: list[dict[str, Any]], key: str = "server_ts") -> list[dict[str, Any]]:
    return sorted(items, key=lambda item: item.get(key) or datetime.min, reverse=True)


class InMemoryTelemetryRepository:
    def __init__(self) -> None:
        self._items: list[dict[str, Any]] = []

    async def insert_reading(self, doc: dict[str, Any]) -> None:
        self._items.append(dict(doc))

    async def get_recent(self, room_id: str, limit: int = 120) -> list[dict[str, Any]]:
        items = [item for item in self._items if item.get("roomId") == room_id]
        return list(reversed(_sort_by_timestamp(items, key="server_ts")[:limit]))


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


class InMemoryFeedbackRepository:
    def __init__(self) -> None:
        self._items: list[dict[str, Any]] = []

    async def insert_feedback(self, doc: dict[str, Any]) -> None:
        self._items.append(dict(doc))


class InMemoryRoomSnapshotRepository:
    def __init__(self) -> None:
        self._items: dict[str, dict[str, Any]] = {}

    async def upsert_snapshot(self, room_id: str, doc: dict[str, Any]) -> None:
        self._items[room_id] = dict(doc)

    async def get_all(self) -> list[dict[str, Any]]:
        return list(self._items.values())
