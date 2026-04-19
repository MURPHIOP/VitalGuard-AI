from datetime import datetime, timezone
from time import time

from app.utils.logger import logger

from app.core.buffers import SlidingWindowBuffer
from app.core.feature_extractor import extract_feature_vector
from app.core.inference_engine import InferenceEngine
from app.core.room_state_manager import RoomStateManager
from app.db.repositories import RoomSnapshotRepository, TelemetryRepository
from app.models.telemetry import TelemetryIn
from app.services.anomaly_service import AnomalyService
from app.services.broadcast_service import BroadcastService
from app.utils.time import now_utc


class TelemetryService:
    def __init__(
        self,
        telemetry_repo: TelemetryRepository,
        room_snapshot_repo: RoomSnapshotRepository,
        room_state_manager: RoomStateManager,
        inference_engine: InferenceEngine,
        anomaly_service: AnomalyService,
        broadcast_service: BroadcastService,
        window_size: int,
        step_size: int,
    ) -> None:
        self.telemetry_repo = telemetry_repo
        self.room_snapshot_repo = room_snapshot_repo
        self.room_state_manager = room_state_manager
        self.inference_engine = inference_engine
        self.anomaly_service = anomaly_service
        self.broadcast_service = broadcast_service
        self.window_size = window_size
        self.step_size = step_size
        self.buffers: dict[str, SlidingWindowBuffer] = {}
        self.last_fall_at: dict[str, datetime] = {}

    async def process_telemetry(self, telemetry: TelemetryIn) -> dict:
        received_at = now_utc()
        latency_ms = max(0, int((time() - telemetry.ts) * 1000))

        buffer = self.buffers.get(telemetry.room_id)
        if buffer is None:
            buffer = SlidingWindowBuffer(window_size=self.window_size, step_size=self.step_size)
            self.buffers[telemetry.room_id] = buffer

        raw = telemetry.model_dump(by_alias=True)
        buffer.append(raw)

        if buffer.is_ready():
            features = extract_feature_vector(buffer.emit_window())
            inference = self.inference_engine.infer(features)
            label = inference.label
            confidence = inference.confidence
        else:
            label = self._cold_start_label(telemetry)
            confidence = 0.65 if label != "EMPTY" else 0.9

        enriched = {
            "roomId": telemetry.room_id,
            "ts": telemetry.ts,
            "ms": telemetry.ms,
            "me": telemetry.me,
            "ss": telemetry.ss,
            "se": telemetry.se,
            "dd": telemetry.dd,
            "nodeBattery": telemetry.node_battery,
            "label": label,
            "confidence": confidence,
            "server_ts": received_at,
            "latency_ms": latency_ms,
        }

        await self.telemetry_repo.insert_reading(enriched)

        room_state = self.room_state_manager.upsert(
            room_id=telemetry.room_id,
            label=label,
            confidence=confidence,
            latency_ms=latency_ms,
            telemetry_doc=enriched,
            node_battery=telemetry.node_battery,
        )

        await self.room_snapshot_repo.upsert_snapshot(
            telemetry.room_id,
            room_state.model_dump(by_alias=True),
        )

        await self.broadcast_service.publish_room_update(
            telemetry.room_id,
            {
                "room": room_state.to_wire(),
                "telemetry": self._serialize_for_socket(enriched),
            },
        )

        if label == "FALL" and self._should_record_fall(telemetry.room_id, received_at):
            anomaly = await self.anomaly_service.create_fall_event(room_id=telemetry.room_id, confidence=confidence)
            await self.broadcast_service.publish_alert(
                {
                    "event": "FALL",
                    "roomId": telemetry.room_id,
                    "confidence": confidence,
                    "timestamp": anomaly.timestamp.isoformat(),
                    "anomalyId": anomaly.id,
                }
            )

        logger.debug(
            "Telemetry processed room={} label={} confidence={} latency_ms={}",
            telemetry.room_id,
            label,
            confidence,
            latency_ms,
        )

        return self._serialize_for_socket(enriched)

    def _cold_start_label(self, telemetry: TelemetryIn) -> str:
        if telemetry.me < 4 and telemetry.se < 3 and telemetry.dd < 75:
            return "EMPTY"
        return "NORMAL"

    def _should_record_fall(self, room_id: str, now_dt: datetime) -> bool:
        last = self.last_fall_at.get(room_id)
        if last is None or (now_dt - last).total_seconds() > 12:
            self.last_fall_at[room_id] = now_dt
            return True
        return False

    def _serialize_for_socket(self, doc: dict) -> dict:
        copy = dict(doc)
        server_ts = copy.get("server_ts")
        if isinstance(server_ts, datetime):
            copy["server_ts"] = server_ts.astimezone(timezone.utc).isoformat()
        return copy
