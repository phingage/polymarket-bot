import logging
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from typing import List, Dict, Any, Optional
from datetime import datetime
from src.config import config

logger = logging.getLogger(__name__)

class MongoDBClient:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db: Optional[Database] = None
        self.markets_collection: Optional[Collection] = None
        self.book_data_collection: Optional[Collection] = None
        
    def connect(self) -> bool:
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(config.MONGO_URI)
            self.db = self.client[config.MONGO_DB]
            self.markets_collection = self.db[config.MONGO_COLLECTION]
            self.book_data_collection = self.db[config.BOOK_DATA_COLLECTION]
            
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {config.MONGO_URI}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    def get_monitored_markets(self) -> List[Dict[str, Any]]:
        """Get all markets that are marked as monitored"""
        try:
            query = {
                "monitored": True,
                "clobRewards": {"$exists": True, "$ne": []}
            }
            
            markets = list(self.markets_collection.find(query))
            logger.info(f"Found {len(markets)} monitored markets")
            return markets
            
        except Exception as e:
            logger.error(f"Error fetching monitored markets: {e}")
            return []
    
    def store_book_data(self, market_id: str, asset_id: str, book_data: Dict[str, Any]) -> bool:
        """Store book data for a specific market"""
        try:
            document = {
                "market_id": market_id,
                "asset_id": asset_id,
                "timestamp": datetime.utcnow(),
                "book_data": book_data,
                "created_at": datetime.utcnow()
            }
            
            # Create index for efficient querying
            self.book_data_collection.create_index([
                ("market_id", 1),
                ("asset_id", 1),
                ("timestamp", -1)
            ])
            
            result = self.book_data_collection.insert_one(document)
            logger.debug(f"Stored book data for market {market_id}, document_id: {result.inserted_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error storing book data for market {market_id}: {e}")
            return False
    
    def get_latest_book_data(self, market_id: str, asset_id: str) -> Optional[Dict[str, Any]]:
        """Get the latest book data for a specific market and asset"""
        try:
            query = {
                "market_id": market_id,
                "asset_id": asset_id
            }
            
            result = self.book_data_collection.find_one(
                query, 
                sort=[("timestamp", -1)]
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching latest book data for market {market_id}: {e}")
            return None
    
    def cleanup_old_book_data(self, days_to_keep: int = 7) -> int:
        """Clean up book data older than specified days"""
        try:
            cutoff_date = datetime.utcnow().replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            cutoff_date = cutoff_date.replace(day=cutoff_date.day - days_to_keep)
            
            result = self.book_data_collection.delete_many({
                "timestamp": {"$lt": cutoff_date}
            })
            
            deleted_count = result.deleted_count
            logger.info(f"Cleaned up {deleted_count} old book data records")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old book data: {e}")
            return 0

# Global database instance
db_client = MongoDBClient()