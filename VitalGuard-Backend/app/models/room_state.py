from collections import deque
from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class RoomStatus(str, Enum):
    NORMAL = "NORMAL"
    EMPTY = "EMPTY"
    FALL = "FALL"
    OFFLINE = "OFFLINE"


class RoomState(BaseModel):
    room_id: str = Field(alias="roomId")
    label: RoomStatus
    confidence: float
    last_update: datetime = Field(alias="lastUpdate")
    latency_ms: int = Field(alias="latencyMs")
    connectivity: str
    node_battery: Optional[int] = Field(default=None, alias="nodeBattery")
    latest_telemetry: dict[str, Any] = Field(default_factory=dict, alias="latestTelemetry")
    chart_cache: list[dict[str, Any]] = Field(default_factory=list, alias="chartCache")

    model_config = {
        "populate_by_name": True,
    }

    def to_wire(self) -> dict[str, Any]:
        def encode(value: Any) -> Any:
            if isinstance(value, datetime):
                return value.isoformat()
            if isinstance(value, dict):
                return {key: encode(item) for key, item in value.items()}
            if isinstance(value, list):
                return [encode(item) for item in value]
            return value

        return encode(self.model_dump(by_alias=True))


class RoomRuntimeState:
    def __init__(
        self,
        room_id: str,
        chart_cache_size: int = 120,
    ) -> None:
        self.room_id = room_id
        self.label: RoomStatus = RoomStatus.NORMAL
        self.confidence: float = 0.0
        self.last_update: Optional[datetime] = None
        self.latency_ms: int = 0
        self.connectivity: str = "ONLINE"
        self.node_battery: Optional[int] = None
        self.latest_telemetry: dict[str, Any] = {}
        self.chart_cache = deque(maxlen=chart_cache_size)

    def as_model(self) -> RoomState:
        assert self.last_update is not None
        return RoomState(
            roomId=self.room_id,
            label=self.label,
            confidence=self.confidence,
            lastUpdate=self.last_update,
            latencyMs=self.latency_ms,
            connectivity=self.connectivity,
            nodeBattery=self.node_battery,
            latestTelemetry=self.latest_telemetry,
            chartCache=list(self.chart_cache),
        )
