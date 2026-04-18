from .routes_feedback import router as feedback_router
from .routes_history import router as history_router
from .routes_rooms import router as rooms_router
from .routes_status import router as status_router

__all__ = [
    "feedback_router",
    "history_router",
    "rooms_router",
    "status_router",
]
