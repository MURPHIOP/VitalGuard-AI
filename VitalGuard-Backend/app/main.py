import asyncio
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api import feedback_router, history_router, rooms_router, status_router
from app.config import Settings, get_settings
from app.core.inference_engine import InferenceEngine
from app.core.mock_stream import MockTelemetryStream
from app.core.room_state_manager import RoomStateManager
from app.core.websocket_manager import WebSocketManager
from app.db.repositories import (
    InMemoryAnomalyRepository,
    InMemoryFeedbackRepository,
    InMemoryRoomSnapshotRepository,
    InMemoryTelemetryRepository,
)
from app.logging_config import configure_logging
from app.models.telemetry import TelemetryIn
from app.services.anomaly_service import AnomalyService
from app.services.broadcast_service import BroadcastService
from app.services.feedback_service import FeedbackService
from app.services.telemetry_service import TelemetryService


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = get_settings()
    configure_logging(settings.log_level)

    logger.info("Starting {}", settings.app_name)
    logger.info(
        "Deployment mode: app_env={} storage_mode={} mock_stream={} mock_inference={}",
        settings.app_env,
        settings.storage_mode,
        settings.use_mock_stream,
        settings.use_mock_inference,
    )
    logger.info("Storage mode: memory-only repositories enabled")

    telemetry_repo = InMemoryTelemetryRepository()
    anomaly_repo = InMemoryAnomalyRepository()
    feedback_repo = InMemoryFeedbackRepository()
    snapshot_repo = InMemoryRoomSnapshotRepository()

    room_state_manager = RoomStateManager(
        chart_cache_size=settings.chart_cache_size,
        stale_room_seconds=settings.stale_room_seconds,
    )

    ws_manager = WebSocketManager()
    broadcast_service = BroadcastService(ws_manager)

    inference_engine = InferenceEngine(
        model_path=settings.resolved_model_path,
        use_mock_if_missing=settings.use_mock_inference,
    )
    inference_engine.load()

    anomaly_service = AnomalyService(repository=anomaly_repo)
    feedback_service = FeedbackService(feedback_repo=feedback_repo, anomaly_repo=anomaly_repo)

    telemetry_service = TelemetryService(
        telemetry_repo=telemetry_repo,
        room_snapshot_repo=snapshot_repo,
        room_state_manager=room_state_manager,
        inference_engine=inference_engine,
        anomaly_service=anomaly_service,
        broadcast_service=broadcast_service,
        window_size=settings.window_size,
        step_size=settings.step_size,
    )

    mock_stream: MockTelemetryStream | None = None
    if settings.use_mock_stream:
        mock_stream = MockTelemetryStream(room_ids=settings.mock_rooms, hz=10.0)
        mock_stream.start(callback=telemetry_service.process_telemetry)

    app.state.settings = settings
    app.state.telemetry_repo = telemetry_repo
    app.state.anomaly_repo = anomaly_repo
    app.state.feedback_repo = feedback_repo
    app.state.snapshot_repo = snapshot_repo
    app.state.room_state_manager = room_state_manager
    app.state.ws_manager = ws_manager
    app.state.broadcast_service = broadcast_service
    app.state.inference_engine = inference_engine
    app.state.anomaly_service = anomaly_service
    app.state.feedback_service = feedback_service
    app.state.telemetry_service = telemetry_service
    app.state.mock_stream = mock_stream

    stale_task = asyncio.create_task(stale_broadcast_loop(app))

    try:
        yield
    finally:
        stale_task.cancel()
        try:
            await stale_task
        except asyncio.CancelledError:
            pass

        if mock_stream is not None:
            await mock_stream.stop()

        logger.info("{} stopped", settings.app_name)


def build_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

    allow_origins = ["*"] if settings.cors_allow_all else settings.cors_origin_list
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=not settings.cors_allow_all,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(status_router)
    app.include_router(rooms_router)
    app.include_router(history_router)
    app.include_router(feedback_router)

    register_websocket_routes(app)

    return app


def register_websocket_routes(app: FastAPI) -> None:
    @app.websocket("/ws/telemetry")
    async def telemetry_socket(websocket: WebSocket):
        ws_manager: WebSocketManager = app.state.ws_manager
        telemetry_service: TelemetryService = app.state.telemetry_service
        conn_id = await ws_manager.connect_telemetry(websocket)
        try:
            while True:
                payload = await websocket.receive_json()
                try:
                    telemetry = TelemetryIn.model_validate(payload)
                    enriched = await telemetry_service.process_telemetry(telemetry)
                    await websocket.send_json({"ok": True, "label": enriched["label"], "server_ts": enriched["server_ts"]})
                except Exception as exc:
                    logger.warning("Malformed telemetry payload or processing error: {}", exc)
                    await websocket.send_json({"ok": False, "error": str(exc)})
        except WebSocketDisconnect:
            pass
        finally:
            await ws_manager.disconnect_telemetry(conn_id)

    @app.websocket("/ws/clients")
    async def clients_socket(websocket: WebSocket):
        ws_manager: WebSocketManager = app.state.ws_manager
        room_manager: RoomStateManager = app.state.room_state_manager

        room_filter = websocket.query_params.get("rooms")
        rooms = room_filter.split(",") if room_filter else None

        conn_id = await ws_manager.connect_client(websocket, rooms=rooms)
        try:
            await websocket.send_json(
                {
                    "type": "bootstrap",
                    "payload": {
                        "rooms": [room.to_wire() for room in room_manager.all_rooms()],
                    },
                }
            )
            while True:
                # Keep socket alive and allow client ping messages.
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            await ws_manager.disconnect_client(conn_id)


async def stale_broadcast_loop(app: FastAPI) -> None:
    room_manager: RoomStateManager = app.state.room_state_manager
    broadcaster: BroadcastService = app.state.broadcast_service

    while True:
        await asyncio.sleep(3)
        rooms = [room.to_wire() for room in room_manager.all_rooms()]
        await broadcaster.publish_system({"rooms": rooms, "kind": "heartbeat"})


app = build_app()


def run() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
