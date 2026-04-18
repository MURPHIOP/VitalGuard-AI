from loguru import logger

from app.db.repositories import AnomalyRepository, FeedbackRepository
from app.models.feedback import FeedbackCreate, FeedbackRecord
from app.utils.ids import new_event_id


class FeedbackService:
    def __init__(self, feedback_repo: FeedbackRepository, anomaly_repo: AnomalyRepository) -> None:
        self.feedback_repo = feedback_repo
        self.anomaly_repo = anomaly_repo

    async def submit_feedback(self, payload: FeedbackCreate) -> FeedbackRecord:
        anomaly_id = payload.anomaly_id
        if anomaly_id is None:
            latest = await self.anomaly_repo.latest_pending_fall(payload.room_id)
            anomaly_id = latest["id"] if latest else None

        record = FeedbackRecord(
            id=new_event_id("fbk"),
            roomId=payload.room_id,
            event=payload.event,
            feedback=payload.feedback,
            timestamp=payload.timestamp,
            anomalyId=anomaly_id,
        )
        await self.feedback_repo.insert_feedback(record.model_dump(by_alias=True))

        if anomaly_id:
            await self.anomaly_repo.update_feedback(anomaly_id, payload.feedback.value)
            logger.info("Feedback linked to anomaly {} room={} feedback={}", anomaly_id, payload.room_id, payload.feedback)
        else:
            logger.warning("Feedback stored without anomaly link room={} feedback={}", payload.room_id, payload.feedback)

        return record
