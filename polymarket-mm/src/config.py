import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Config(BaseSettings):
    # MongoDB Configuration
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB: str = os.getenv("MONGO_DB", "polymarket_bot")
    MONGO_COLLECTION: str = os.getenv("MONGO_COLLECTION", "markets")
    BOOK_DATA_COLLECTION: str = os.getenv("BOOK_DATA_COLLECTION", "book_data")
    
    # Polymarket API Configuration
    POLYMARKET_API_KEY: str = os.getenv("POLYMARKET_API_KEY", "")
    POLYMARKET_SECRET: str = os.getenv("POLYMARKET_SECRET", "")
    POLYMARKET_PASSPHRASE: str = os.getenv("POLYMARKET_PASSPHRASE", "")
    
    # WebSocket Configuration
    POLYMARKET_WSS_URL: str = os.getenv("POLYMARKET_WSS_URL", "wss://ws-subscriptions-clob.polymarket.com/ws/")
    
    # Application Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    UPDATE_INTERVAL: int = int(os.getenv("UPDATE_INTERVAL", "1"))

config = Config()