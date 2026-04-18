from collections import deque
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SlidingWindowBuffer:
    window_size: int
    step_size: int
    _items: deque[dict[str, Any]] = field(default_factory=deque)
    _since_last_emit: int = 0

    def append(self, sample: dict[str, Any]) -> None:
        self._items.append(sample)
        if len(self._items) > self.window_size:
            self._items.popleft()
        self._since_last_emit += 1

    def is_ready(self) -> bool:
        return len(self._items) >= self.window_size and self._since_last_emit >= self.step_size

    def emit_window(self) -> list[dict[str, Any]]:
        self._since_last_emit = 0
        return list(self._items)

    def size(self) -> int:
        return len(self._items)
