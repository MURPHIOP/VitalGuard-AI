from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class FeedbackValue(str, Enum):
    FALSE_ALARM = "FALSE_ALARM"
    CONFIRMED_FALL = "CONFIRMED_FALL"


class FeedbackCreate(BaseModel):
    room_id: str = Field(alias="roomId", min_length=1)
    event: str = Field(default="FALL")
    feedback: FeedbackValue
    timestamp: datetime
    anomaly_id: Optional[str] = Field(default=None, alias="anomalyId")

    model_config = {
        "populate_by_name": True,
    }


class FeedbackRecord(BaseModel):
    id: str
    room_id: str = Field(alias="roomId")
    event: str
    feedback: FeedbackValue
    timestamp: datetime
    anomaly_id: Optional[str] = Field(default=None, alias="anomalyId")

    model_config = {
        "populate_by_name": True,
    }
