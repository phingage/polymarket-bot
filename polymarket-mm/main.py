#!/usr/bin/env python3

import asyncio
import logging
import signal
import sys
from typing import Dict, Any, List
from datetime import datetime

from src.config import config
from src.database import db_client
from src.market_monitor import market_monitor
from src.websocket_client import websocket_client

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('polymarket_mm.log')
    ]
)

logger = logging.getLogger(__name__)

class PolymarketMarketMaker:
    def __init__(self):
        self.running = False
        self.tasks = []
        
    async def book_message_handler(self, message: Dict[str, Any]):
        """Handle book updates from WebSocket"""
        try:
            asset_id = message.get('asset_id')
            if not asset_id:
                return
            
            # Find market ID for this asset
            market_id = await self.find_market_for_asset(asset_id)
            if not market_id:
                logger.warning(f"No market found for asset {asset_id}")
                return
            
            # Extract book data
            book_data = {
                'bids': message.get('bids', []),
                'asks': message.get('asks', []),
                'spread': message.get('spread'),
                'mid_price': self.calculate_mid_price(message.get('bids', []), message.get('asks', [])),
                'timestamp': message.get('timestamp', datetime.utcnow().isoformat()),
                'sequence': message.get('sequence'),
                'last_update_id': message.get('last_update_id')
            }
            
            # Store book data
            success = db_client.store_book_data(market_id, asset_id, book_data)
            
            if success:
                logger.debug(f"Stored book data for market {market_id}, asset {asset_id}")
            else:
                logger.error(f"Failed to store book data for market {market_id}, asset {asset_id}")
                
        except Exception as e:
            logger.error(f"Error in book message handler: {e}")
    
    def calculate_mid_price(self, bids: List, asks: List) -> float:
        """Calculate mid price from bids and asks"""
        try:
            if not bids or not asks:
                return 0.0
            
            best_bid = float(bids[0]['price']) if bids else 0.0
            best_ask = float(asks[0]['price']) if asks else 0.0
            
            if best_bid > 0 and best_ask > 0:
                return (best_bid + best_ask) / 2.0
            
            return best_bid or best_ask
            
        except (ValueError, IndexError, KeyError):
            return 0.0
    
    async def find_market_for_asset(self, asset_id: str) -> str:
        """Find market ID for given asset ID"""
        # This would need to be implemented based on how asset IDs
        # map to market IDs in your system
        # For now, return a placeholder
        return f"market_for_{asset_id}"
    
    async def get_all_monitored_asset_ids(self) -> List[str]:
        """Get all asset IDs from monitored markets"""
        try:
            markets = db_client.get_monitored_markets()
            asset_ids = []
            
            for market in markets:
                clob_rewards = market.get('clobRewards', [])
                for reward in clob_rewards:
                    if 'asset_id' in reward:
                        asset_ids.append(reward['asset_id'])
                
                # If no asset IDs in rewards, try to extract from market structure
                # This might need adjustment based on actual data structure
                if not clob_rewards and 'id' in market:
                    # Placeholder: derive asset ID from market ID
                    # Real implementation would depend on Polymarket's ID system
                    market_id = market['id']
                    # This is a placeholder - actual asset ID extraction needed
                    logger.warning(f"No asset IDs found for market {market_id}")
            
            logger.info(f"Found {len(asset_ids)} asset IDs from {len(markets)} monitored markets")
            return list(set(asset_ids))  # Remove duplicates
            
        except Exception as e:
            logger.error(f"Error getting monitored asset IDs: {e}")
            return []
    
    async def periodic_cleanup(self):
        """Periodic cleanup of old data"""
        while self.running:
            try:
                # Wait 1 hour
                await asyncio.sleep(3600)
                
                # Cleanup old book data (keep last 7 days)
                deleted_count = db_client.cleanup_old_book_data(days_to_keep=7)
                logger.info(f"Cleaned up {deleted_count} old book data records")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}")
    
    async def start(self):
        """Start the market maker"""
        try:
            logger.info("Starting Polymarket Market Maker...")
            self.running = True
            
            # Connect to database
            if not db_client.connect():
                logger.error("Failed to connect to database")
                return False
            
            # Get all asset IDs to monitor
            asset_ids = await self.get_all_monitored_asset_ids()
            
            if not asset_ids:
                logger.warning("No asset IDs found to monitor")
                return False
            
            logger.info(f"Monitoring {len(asset_ids)} assets")
            
            # Start periodic cleanup task
            cleanup_task = asyncio.create_task(self.periodic_cleanup())
            self.tasks.append(cleanup_task)
            
            # Start WebSocket client with reconnection loop
            websocket_task = asyncio.create_task(
                websocket_client.reconnect_loop(
                    asset_ids, 
                    self.book_message_handler,
                    max_retries=10
                )
            )
            self.tasks.append(websocket_task)
            
            # Wait for tasks to complete
            await asyncio.gather(*self.tasks, return_exceptions=True)
            
            return True
            
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
            return True
        except Exception as e:
            logger.error(f"Error starting market maker: {e}")
            return False
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop the market maker"""
        try:
            logger.info("Stopping Polymarket Market Maker...")
            self.running = False
            
            # Cancel all tasks
            for task in self.tasks:
                task.cancel()
            
            # Wait for tasks to complete
            if self.tasks:
                await asyncio.gather(*self.tasks, return_exceptions=True)
            
            # Close WebSocket connection
            await websocket_client.close()
            
            # Disconnect from database
            db_client.disconnect()
            
            logger.info("Polymarket Market Maker stopped")
            
        except Exception as e:
            logger.error(f"Error stopping market maker: {e}")

# Global application instance
app = PolymarketMarketMaker()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"Received signal {signum}")
    asyncio.create_task(app.stop())

async def main():
    """Main application entry point"""
    try:
        # Register signal handlers
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Start the application
        await app.start()
        
    except Exception as e:
        logger.error(f"Application error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        # Print startup information
        print("=" * 50)
        print("Polymarket Market Maker v1.0")
        print("=" * 50)
        print(f"MongoDB URI: {config.MONGO_URI}")
        print(f"MongoDB Database: {config.MONGO_DB}")
        print(f"Markets Collection: {config.MONGO_COLLECTION}")
        print(f"Book Data Collection: {config.BOOK_DATA_COLLECTION}")
        print(f"WebSocket URL: {config.POLYMARKET_WSS_URL}")
        print(f"Log Level: {config.LOG_LEVEL}")
        print("=" * 50)
        
        # Run the application
        asyncio.run(main())
        
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)