from fastapi import APIRouter, Depends, Request

from app.models.feedback import FeedbackCreate

router = APIRouter(prefix="/api", tags=["feedback"])


def get_feedback_service(request: Request):
    return request.app.state.feedback_service


@router.post("/feedback")
async def submit_feedback(
    payload: FeedbackCreate,
    feedback_service=Depends(get_feedback_service),
) -> dict:
    record = await feedback_service.submit_feedback(payload)
    return {
        "ok": True,
        "feedback": record.model_dump(by_alias=True),
    }
