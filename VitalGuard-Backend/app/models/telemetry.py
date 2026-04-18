from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TelemetryIn(BaseModel):
    room_id: str = Field(alias="roomId", min_length=1)
    ts: int = Field(description="Device epoch timestamp (seconds)")
    ms: float = Field(description="Moving distance")
    me: float = Field(description="Moving energy")
    ss: float = Field(description="Stationary distance")
    se: float = Field(description="Stationary energy")
    dd: float = Field(description="Detection distance")
    node_battery: Optional[int] = Field(default=None, alias="nodeBattery")

    @field_validator("node_battery")
    @classmethod
    def validate_battery(cls, value: Optional[int]) -> Optional[int]:
        if value is None:
            return value
        if value < 0 or value > 100:
            raise ValueError("nodeBattery must be in [0, 100]")
        return value


class TelemetryOut(BaseModel):
    room_id: str = Field(alias="roomId")
    label: str
    ms: float
    me: float
    ss: float
    se: float
    dd: float
    confidence: float
    server_ts: datetime = Field(alias="server_ts")
    latency_ms: int
    node_battery: Optional[int] = Field(default=None, alias="nodeBattery")
    ts: int

    model_config = {
        "populate_by_name": True,
    }
