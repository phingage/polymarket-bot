import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB Configuration
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB = os.getenv("MONGO_DB", "polymarket_bot")
    MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "markets")
    BOOK_DATA_COLLECTION = os.getenv("BOOK_DATA_COLLECTION", "book_data")
    
    # Polymarket API Configuration
    POLYMARKET_API_KEY = os.getenv("POLYMARKET_API_KEY", "")
    
    # WebSocket Configuration
    POLYMARKET_WSS_URL = os.getenv("POLYMARKET_WSS_URL", "wss://ws-subscriptions-clob.polymarket.com/ws/")
    
    # Application Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    UPDATE_INTERVAL = int(os.getenv("UPDATE_INTERVAL", "1"))
    MARKET_CHECK_INTERVAL = int(os.getenv("MARKET_CHECK_INTERVAL", "300"))  # Default 5 minutes
    
    # RabbitMQ Configuration
    RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://localhost:5672")
    RABBITMQ_NOTIFICATION_QUEUE = os.getenv("RABBITMQ_NOTIFICATION_QUEUE", "notification")
    RABBITMQ_MARKETS_TOPIC = os.getenv("RABBITMQ_MARKETS_TOPIC", "markets")

config = Config()