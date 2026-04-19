import asyncio
import random
import time
from dataclasses import dataclass

from app.utils.logger import logger

from app.models.telemetry import TelemetryIn


@dataclass
class RoomMockState:
    room_id: str
    previous_label: str = "NORMAL"


class MockTelemetryStream:
    def __init__(self, room_ids: list[str], hz: float = 10.0) -> None:
        self._room_states = [RoomMockState(room_id=room_id) for room_id in room_ids]
        self._tick_sleep = 1.0 / hz
        self._running = False
        self._task: asyncio.Task | None = None

    def start(self, callback) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run(callback))
        logger.info("Mock telemetry stream started for rooms: {}", [r.room_id for r in self._room_states])

    async def stop(self) -> None:
        self._running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Mock telemetry stream stopped")

    async def _run(self, callback) -> None:
        while self._running:
            ts = int(time.time())
            for room in self._room_states:
                payload = self._make_payload(room, ts)
                try:
                    await callback(payload)
                except Exception as exc:
                    logger.exception("Mock stream callback failed: {}", exc)
            await asyncio.sleep(self._tick_sleep)

    def _make_payload(self, room: RoomMockState, ts: int) -> TelemetryIn:
        roll = random.random()
        if roll > 0.992:
            label = "FALL"
        elif roll < 0.15:
            label = "EMPTY"
        else:
            label = "NORMAL"

        if room.previous_label == "FALL" and random.random() < 0.4:
            label = "FALL"

        room.previous_label = label

        if label == "EMPTY":
            me = random.uniform(0.4, 4.0)
            se = random.uniform(0.3, 2.8)
            dd = random.uniform(20.0, 60.0)
        elif label == "FALL":
            me = random.uniform(90.0, 180.0)
            se = random.uniform(10.0, 35.0)
            dd = random.uniform(110.0, 240.0)
        else:
            me = random.uniform(25.0, 75.0)
            se = random.uniform(8.0, 25.0)
            dd = random.uniform(90.0, 170.0)

        return TelemetryIn(
            roomId=room.room_id,
            ts=ts,
            ms=dd + random.uniform(-12.0, 12.0),
            me=me,
            ss=dd - random.uniform(8.0, 25.0),
            se=se,
            dd=dd,
            nodeBattery=random.randint(45, 100),
        )
