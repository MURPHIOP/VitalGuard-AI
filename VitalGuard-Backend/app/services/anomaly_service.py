from app.utils.logger import logger

from app.db.repositories import AnomalyRepository
from app.models.anomaly import AnomalyRecord
from app.utils.ids import new_event_id
from app.utils.time import now_utc


class AnomalyService:
    def __init__(self, repository: AnomalyRepository) -> None:
        self.repository = repository

    async def create_fall_event(self, room_id: str, confidence: float) -> AnomalyRecord:
        event = AnomalyRecord(
            id=new_event_id("evt"),
            roomId=room_id,
            type="FALL",
            timestamp=now_utc(),
            confidence=confidence,
            feedback="PENDING",
        )
        doc = event.model_dump(by_alias=True)
        await self.repository.insert_anomaly(doc)
        logger.warning("FALL anomaly recorded for room {} confidence={} id={}", room_id, confidence, event.id)
        return event

    async def list_history(self, limit: int = 100) -> list[dict]:
        return await self.repository.get_history(limit=limit)

    async def list_room_history(self, room_id: str, limit: int = 100) -> list[dict]:
        return await self.repository.get_history_by_room(room_id=room_id, limit=limit)
