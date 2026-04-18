from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import Settings


class MongoManager:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client: AsyncIOMotorClient | None = None
        self.database: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        self.client = AsyncIOMotorClient(
            self.settings.mongodb_uri,
            serverSelectionTimeoutMS=1000,
            connectTimeoutMS=1000,
            socketTimeoutMS=1000,
        )
        self.database = self.client[self.settings.mongodb_db]
        await self.client.admin.command("ping")

    async def disconnect(self) -> None:
        if self.client is not None:
            self.client.close()
            self.client = None
            self.database = None

    def db(self) -> AsyncIOMotorDatabase:
        if self.database is None:
            raise RuntimeError("MongoManager is not connected")
        return self.database
