import logging


class _LoggerFallback:
    def __init__(self, name: str = "vitalguard") -> None:
        self._logger = logging.getLogger(name)

    def debug(self, message: str, *args) -> None:
        self._logger.debug(message.format(*args) if args else message)

    def info(self, message: str, *args) -> None:
        self._logger.info(message.format(*args) if args else message)

    def warning(self, message: str, *args) -> None:
        self._logger.warning(message.format(*args) if args else message)

    def exception(self, message: str, *args) -> None:
        self._logger.exception(message.format(*args) if args else message)


try:
    from loguru import logger as logger
except Exception:
    logger = _LoggerFallback()
