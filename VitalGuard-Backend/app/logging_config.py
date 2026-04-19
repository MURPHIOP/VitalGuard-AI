import logging
import sys

try:
    from loguru import logger
except Exception:
    logger = None


def configure_logging(level: str = "INFO") -> None:
    if logger is None:
        logging.basicConfig(
            level=getattr(logging, level.upper(), logging.INFO),
            format="%(asctime)s | %(levelname)s | %(name)s:%(funcName)s:%(lineno)d - %(message)s",
            stream=sys.stdout,
            force=True,
        )
        return

    logger.remove()
    logger.add(
        sys.stdout,
        level=level.upper(),
        backtrace=False,
        diagnose=False,
        enqueue=False,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    )

    class InterceptHandler(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            try:
                level_name = logger.level(record.levelname).name
            except Exception:
                level_name = record.levelno
            logger.bind(source=record.name).log(level_name, record.getMessage())

    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
