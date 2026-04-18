from app.core.websocket_manager import WebSocketManager


class BroadcastService:
    def __init__(self, ws_manager: WebSocketManager) -> None:
        self.ws_manager = ws_manager

    async def publish_room_update(self, room_id: str, payload: dict) -> None:
        await self.ws_manager.broadcast_room(room_id, {"type": "room_update", "payload": payload})

    async def publish_alert(self, payload: dict) -> None:
        await self.ws_manager.broadcast({"type": "alert", "payload": payload})

    async def publish_system(self, payload: dict) -> None:
        await self.ws_manager.broadcast({"type": "system", "payload": payload})
