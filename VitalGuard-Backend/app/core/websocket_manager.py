import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket
from loguru import logger


class WebSocketManager:
    def __init__(self) -> None:
        self._telemetry_connections: dict[int, WebSocket] = {}
        self._client_connections: dict[int, WebSocket] = {}
        self._client_rooms: dict[int, set[str]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect_telemetry(self, websocket: WebSocket) -> int:
        await websocket.accept()
        conn_id = id(websocket)
        async with self._lock:
            self._telemetry_connections[conn_id] = websocket
        logger.info("Telemetry websocket connected: {}", conn_id)
        return conn_id

    async def connect_client(self, websocket: WebSocket, rooms: list[str] | None = None) -> int:
        await websocket.accept()
        conn_id = id(websocket)
        async with self._lock:
            self._client_connections[conn_id] = websocket
            if rooms:
                self._client_rooms[conn_id] = set(rooms)
        logger.info("Client websocket connected: {}", conn_id)
        return conn_id

    async def disconnect_telemetry(self, conn_id: int) -> None:
        async with self._lock:
            self._telemetry_connections.pop(conn_id, None)
        logger.info("Telemetry websocket disconnected: {}", conn_id)

    async def disconnect_client(self, conn_id: int) -> None:
        async with self._lock:
            self._client_connections.pop(conn_id, None)
            self._client_rooms.pop(conn_id, None)
        logger.info("Client websocket disconnected: {}", conn_id)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        await self._broadcast_internal(payload, room_id=None)

    async def broadcast_room(self, room_id: str, payload: dict[str, Any]) -> None:
        await self._broadcast_internal(payload, room_id=room_id)

    async def _broadcast_internal(self, payload: dict[str, Any], room_id: str | None) -> None:
        stale: list[int] = []

        async with self._lock:
            connections = dict(self._client_connections)
            client_rooms = dict(self._client_rooms)

        for conn_id, socket in connections.items():
            if room_id is not None and client_rooms.get(conn_id):
                allowed_rooms = client_rooms[conn_id]
                if room_id not in allowed_rooms:
                    continue
            try:
                await socket.send_json(payload)
            except Exception:
                stale.append(conn_id)

        if stale:
            async with self._lock:
                for conn_id in stale:
                    self._client_connections.pop(conn_id, None)
                    self._client_rooms.pop(conn_id, None)
            logger.warning("Cleaned stale client websocket connections: {}", stale)

    async def telemetry_connection_count(self) -> int:
        async with self._lock:
            return len(self._telemetry_connections)

    async def client_connection_count(self) -> int:
        async with self._lock:
            return len(self._client_connections)
