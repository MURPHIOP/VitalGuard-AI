from fastapi import APIRouter, Query, Request

router = APIRouter(prefix="/api", tags=["history"])


def _serialize(items: list[dict]) -> list[dict]:
    payload: list[dict] = []
    for item in items:
        copy = dict(item)
        copy.pop("_id", None)
        ts = copy.get("timestamp")
        if hasattr(ts, "isoformat"):
            copy["timestamp"] = ts.isoformat()
        payload.append(copy)
    return payload


@router.get("/history")
async def history(request: Request, limit: int = Query(default=100, ge=1, le=500)) -> dict:
    anomaly_service = request.app.state.anomaly_service
    rows = await anomaly_service.list_history(limit=limit)
    return {"history": _serialize(rows), "count": len(rows)}


@router.get("/history/{room_id}")
async def room_history(request: Request, room_id: str, limit: int = Query(default=100, ge=1, le=500)) -> dict:
    anomaly_service = request.app.state.anomaly_service
    rows = await anomaly_service.list_room_history(room_id=room_id, limit=limit)
    return {"roomId": room_id, "history": _serialize(rows), "count": len(rows)}
