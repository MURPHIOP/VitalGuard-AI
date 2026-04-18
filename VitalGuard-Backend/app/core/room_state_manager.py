from datetime import timedelta

from app.models.room_state import RoomRuntimeState, RoomState, RoomStatus
from app.utils.time import now_utc


class RoomStateManager:
    def __init__(self, chart_cache_size: int, stale_room_seconds: int) -> None:
        self._states: dict[str, RoomRuntimeState] = {}
        self._chart_cache_size = chart_cache_size
        self._stale_room_seconds = stale_room_seconds

    def upsert(
        self,
        room_id: str,
        label: str,
        confidence: float,
        latency_ms: int,
        telemetry_doc: dict,
        node_battery: int | None,
    ) -> RoomState:
        runtime = self._states.get(room_id)
        if runtime is None:
            runtime = RoomRuntimeState(room_id=room_id, chart_cache_size=self._chart_cache_size)
            self._states[room_id] = runtime

        runtime.label = RoomStatus(label)
        runtime.confidence = confidence
        runtime.last_update = now_utc()
        runtime.latency_ms = latency_ms
        runtime.connectivity = "ONLINE"
        runtime.node_battery = node_battery
        runtime.latest_telemetry = telemetry_doc

        runtime.chart_cache.append(
            {
                "server_ts": telemetry_doc.get("server_ts"),
                "me": telemetry_doc.get("me"),
                "se": telemetry_doc.get("se"),
                "dd": telemetry_doc.get("dd"),
                "confidence": confidence,
            }
        )

        return runtime.as_model()

    def all_rooms(self) -> list[RoomState]:
        self._mark_stale_rooms()
        models: list[RoomState] = []
        for runtime in self._states.values():
            if runtime.last_update is None:
                continue
            models.append(runtime.as_model())
        models.sort(key=lambda r: r.room_id)
        return models

    def get_room(self, room_id: str) -> RoomState | None:
        self._mark_stale_rooms()
        runtime = self._states.get(room_id)
        if runtime is None or runtime.last_update is None:
            return None
        return runtime.as_model()

    def _mark_stale_rooms(self) -> None:
        threshold = now_utc() - timedelta(seconds=self._stale_room_seconds)
        for runtime in self._states.values():
            if runtime.last_update is None:
                continue
            if runtime.last_update < threshold:
                runtime.connectivity = "OFFLINE"
                runtime.label = RoomStatus.OFFLINE
                runtime.confidence = 0.0
