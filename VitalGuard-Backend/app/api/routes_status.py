from fastapi import APIRouter, Request

router = APIRouter(prefix="/api", tags=["status"])


@router.get("/health")
async def health() -> dict:
    return {"ok": True}


@router.get("/status")
async def status(request: Request) -> dict:
    room_manager = request.app.state.room_state_manager
    ws_manager = request.app.state.ws_manager

    rooms = room_manager.all_rooms()
    connected_clients = await ws_manager.client_connection_count()
    connected_nodes = await ws_manager.telemetry_connection_count()
    active_alerts = sum(1 for room in rooms if room.label.value == "FALL")

    return {
        "app": request.app.state.settings.app_name,
        "appEnv": request.app.state.settings.app_env,
        "storageMode": request.app.state.settings.storage_mode,
        "rooms": len(rooms),
        "activeAlerts": active_alerts,
        "connectedClients": connected_clients,
        "connectedNodes": connected_nodes,
        "mockMode": request.app.state.settings.use_mock_stream,
    }
