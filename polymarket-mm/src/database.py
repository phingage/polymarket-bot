import logging
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
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
        """Store book data for a specific market - overwrites existing data for the same asset_id"""
        try:
            current_time = datetime.now(timezone.utc)
            
            # Document for book_data collection
            document = {
                "market_id": market_id,
                "asset_id": asset_id,
                "timestamp": current_time,
                "book_data": book_data,
                "updated_at": current_time
            }
            
            # Upsert in book_data collection: update if exists, insert if not
            result = self.book_data_collection.replace_one(
                {"asset_id": asset_id},  # Filter by asset_id
                document,  # Replace with new document
                upsert=True  # Create if doesn't exist
            )
            
            if result.upserted_id:
                logger.debug(f"Inserted new book data for asset {asset_id}")
            else:
                logger.debug(f"Updated book data for asset {asset_id}")
            
            # Also update the markets collection with this book data
            book_entry = {
                "asset_id": asset_id,
                "timestamp": current_time,
                "book_data": book_data,
                "updated_at": current_time
            }
            
            # Update markets collection: remove existing entry with same asset_id and add new one
            markets_result = self.markets_collection.update_one(
                {"conditionId": market_id},  # Find market by conditionId
                {
                    "$pull": {"books": {"asset_id": asset_id}},  # Remove existing book with same asset_id
                },
                upsert=False
            )
            
            # Add the new book entry
            markets_result = self.markets_collection.update_one(
                {"conditionId": market_id},  # Find market by conditionId
                {
                    "$push": {"books": book_entry}  # Add new book entry
                },
                upsert=False
            )
            
            if markets_result.modified_count > 0:
                logger.debug(f"Updated books array in markets collection for conditionId {market_id}")
            else:
                logger.warning(f"No market found with conditionId {market_id} to update books array")
            
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
            cutoff_date = datetime.now(timezone.utc).replace(
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