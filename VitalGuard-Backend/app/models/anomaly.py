from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class AnomalyType(str, Enum):
    FALL = "FALL"
    NORMAL = "NORMAL"
    EMPTY = "EMPTY"


class AnomalyRecord(BaseModel):
    id: str
    room_id: str = Field(alias="roomId")
    type: AnomalyType
    timestamp: datetime
    confidence: float
    feedback: str = "PENDING"

    model_config = {
        "populate_by_name": True,
    }
