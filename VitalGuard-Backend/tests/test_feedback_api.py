from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes_feedback import get_feedback_service, router


class DummyFeedbackService:
    async def submit_feedback(self, payload):
        class DummyRecord:
            def model_dump(self, by_alias: bool = True):
                return {
                    "id": "fbk_test",
                    "roomId": payload.room_id,
                    "event": payload.event,
                    "feedback": payload.feedback.value,
                    "timestamp": payload.timestamp.isoformat(),
                    "anomalyId": None,
                }

        return DummyRecord()


def test_feedback_endpoint_accepts_payload() -> None:
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_feedback_service] = lambda: DummyFeedbackService()

    client = TestClient(app)

    response = client.post(
        "/api/feedback",
        json={
            "roomId": "401",
            "event": "FALL",
            "feedback": "FALSE_ALARM",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["feedback"]["feedback"] == "FALSE_ALARM"
