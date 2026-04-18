from fastapi import APIRouter, HTTPException, Query, Request

router = APIRouter(prefix="/api", tags=["rooms"])


@router.get("/rooms")
async def list_rooms(request: Request) -> dict:
    manager = request.app.state.room_state_manager
    rooms = [room.model_dump(by_alias=True) for room in manager.all_rooms()]
    return {"rooms": rooms, "count": len(rooms)}


@router.get("/rooms/{room_id}")
async def room_detail(request: Request, room_id: str) -> dict:
    manager = request.app.state.room_state_manager
    room = manager.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"room": room.model_dump(by_alias=True)}


@router.get("/telemetry/{room_id}")
async def room_telemetry(request: Request, room_id: str, limit: int = Query(default=120, ge=1, le=500)) -> dict:
    telemetry_repo = request.app.state.telemetry_repo
    records = await telemetry_repo.get_recent(room_id=room_id, limit=limit)
    for item in records:
        if "_id" in item:
            item.pop("_id", None)
        if "server_ts" in item and hasattr(item["server_ts"], "isoformat"):
            item["server_ts"] = item["server_ts"].isoformat()
    return {"roomId": room_id, "telemetry": records, "count": len(records)}
