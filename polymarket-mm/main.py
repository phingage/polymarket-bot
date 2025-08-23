#!/usr/bin/env python3

import asyncio
import logging
import signal
import sys
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from src.config import config
from src.database import db_client
from src.market_monitor import market_monitor
from src.websocket_client import websocket_client
from src.rabbitmq_client import rabbitmq_client

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
        
    async def handle_restart_command(self, command_data: Dict[str, Any]):
        """Handle restart command from RabbitMQ"""
        try:
            logger.info("Received restart command - restarting all components")
            
            # Close current WebSocket connection
            await websocket_client.close()
            
            # Wait a moment for clean shutdown
            await asyncio.sleep(2)
            
            # Get current asset IDs
            asset_ids = await self.get_all_monitored_asset_ids()
            
            if asset_ids:
                # Restart WebSocket with current assets
                success = await websocket_client.start_with_subscriptions(
                    asset_ids, 
                    self.main_message_handler,
                    api_creds=None
                )
                
                if success:
                    logger.info("WebSocket restarted successfully via RabbitMQ command")
                else:
                    logger.error("Failed to restart WebSocket via RabbitMQ command")
            else:
                logger.warning("No asset IDs found, cannot restart WebSocket")
                
        except Exception as e:
            logger.error(f"Error handling restart command: {e}")
        
    async def main_message_handler(self, message: Dict[str, Any]):
        """Main message handler that routes to specific handlers based on event_type"""
        try:
            event_type = message.get('event_type')
            
            if not event_type:
                logger.warning("No event_type in message")
                return
            
            # Route to appropriate handler based on event_type
            if event_type == 'book':
                await self.book_message_handler(message)
            elif event_type == 'price_change':
                await self.price_change_message_handler(message)
            elif event_type == 'tick_size_change':
                await self.tick_size_change_message_handler(message)
            elif event_type == 'last_trade_price':
                await self.last_trade_price_message_handler(message)
            else:
                logger.warning(f"Unknown event_type: {event_type}")
                
        except Exception as e:
            logger.error(f"Error in main message handler: {e}")
    
    async def book_message_handler(self, message: Dict[str, Any]):
        """Handle book event - full orderbook snapshot"""
        try:
            asset_id = message.get('asset_id')
            condition_id = message.get('market')  # The conditionId is in the 'market' field
            
            if not asset_id:
                logger.warning("No asset_id in book message")
                return
            
            if not condition_id:
                logger.warning(f"No conditionId (market field) in book message for asset {asset_id}")
                return
            
            # Use conditionId as market identifier
            market_id = condition_id
            
            # Extract book data
            book_data = {
                'bids': message.get('bids', []),
                'asks': message.get('asks', []),
                'spread': message.get('spread'),
                'mid_price': self.calculate_mid_price(message.get('bids', []), message.get('asks', [])),
                'timestamp': message.get('timestamp', datetime.now(timezone.utc).isoformat()),
                'sequence': message.get('sequence'),
                'last_update_id': message.get('last_update_id'),
                'hash': message.get('hash')
            }
            
            # Store book data
            success = db_client.store_book_data(market_id, asset_id, book_data)
            
            if success:
                logger.info(f"Stored book snapshot for market {market_id}, asset {asset_id}")
            else:
                logger.error(f"Failed to store book data for market {market_id}, asset {asset_id}")
                
        except Exception as e:
            logger.error(f"Error in book message handler: {e}")
    
    async def price_change_message_handler(self, message: Dict[str, Any]):
        """Handle price_change event - order book updates"""
        try:
            asset_id = message.get('asset_id')
            condition_id = message.get('market')
            changes = message.get('changes', [])
            
            logger.info(f"Price change event for asset {asset_id}, changes: {len(changes)}")
            
            # Send RabbitMQ notification for price change
            try:
                await rabbitmq_client.publish_market_notification(
                    asset_id=asset_id,
                    event_type="price_change",
                    data={
                        "market": condition_id,
                        "changes": changes,
                        "timestamp": message.get('timestamp')
                    }
                )
                logger.debug(f"Sent price change notification for asset {asset_id}")
            except Exception as e:
                logger.error(f"Error sending price change notification: {e}")
            
        except Exception as e:
            logger.error(f"Error in price change message handler: {e}")
    
    async def tick_size_change_message_handler(self, message: Dict[str, Any]):
        """Handle tick_size_change event"""
        try:
            asset_id = message.get('asset_id')
            condition_id = message.get('market')
            old_tick_size = message.get('old_tick_size')
            new_tick_size = message.get('new_tick_size')
            
            logger.info(f"Tick size change for asset {asset_id}: {old_tick_size} -> {new_tick_size}")
            
            # TODO: Implement tick size change handling logic
            # For now, just log the event
            
        except Exception as e:
            logger.error(f"Error in tick size change message handler: {e}")
    
    async def last_trade_price_message_handler(self, message: Dict[str, Any]):
        """Handle last_trade_price event - trade execution"""
        try:
            asset_id = message.get('asset_id')
            condition_id = message.get('market')
            price = message.get('price')
            side = message.get('side')
            size = message.get('size')
            
            logger.info(f"Trade executed for asset {asset_id}: {side} {size} at {price}")
            
            # TODO: Implement trade handling logic
            # For now, just log the event
            
        except Exception as e:
            logger.error(f"Error in last trade price message handler: {e}")
   
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
    
    async def find_market_for_asset(self, asset_id: str, condition_id: str = None) -> Optional[str]:
        """Find market conditionId for given asset ID by searching MongoDB"""
        try:
            if condition_id:
                # If we already have the conditionId from the message, use it
                return condition_id
            
            # Search in monitored markets for this asset_id
            markets = db_client.get_monitored_markets()
            
            for market in markets:
                # Check if this market contains the asset_id in its clobTokenIds
                clob_token_ids_str = market.get('clobTokenIds')
                if clob_token_ids_str:
                    try:
                        import json
                        clob_token_ids = json.loads(clob_token_ids_str)
                        
                        if isinstance(clob_token_ids, list) and asset_id in [str(token_id) for token_id in clob_token_ids]:
                            # Return the conditionId for this market
                            return market.get('conditionId')
                    except json.JSONDecodeError:
                        continue
            
            logger.warning(f"No market found for asset_id {asset_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error finding market for asset {asset_id}: {e}")
            return None
    
    async def get_all_monitored_asset_ids(self) -> List[str]:
        """Get all asset IDs from monitored markets"""
        try:
            markets = db_client.get_monitored_markets()
            asset_ids = []
            
            for market in markets:
                # Extract token IDs from clobTokenIds field
                clob_token_ids_str = market.get('clobTokenIds')
                if clob_token_ids_str:
                    try:
                        # Parse the JSON string array
                        import json
                        clob_token_ids = json.loads(clob_token_ids_str)
                        
                        # Each market has 2 token IDs for Yes and No outcomes
                        if isinstance(clob_token_ids, list):
                            for token_id in clob_token_ids:
                                if token_id:  # Make sure token ID is not empty
                                    asset_ids.append(str(token_id))
                            
                            logger.debug(f"Market {market.get('id', 'unknown')} has {len(clob_token_ids)} token IDs: {clob_token_ids}")
                        else:
                            logger.warning(f"clobTokenIds is not a list for market {market.get('id', 'unknown')}: {clob_token_ids}")
                    
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse clobTokenIds for market {market.get('id', 'unknown')}: {e}")
                    except Exception as e:
                        logger.error(f"Error processing clobTokenIds for market {market.get('id', 'unknown')}: {e}")
                else:
                    logger.warning(f"No clobTokenIds found for market {market.get('id', 'unknown')}")
            
            unique_asset_ids = list(set(asset_ids))  # Remove duplicates
            logger.info(f"Found {len(unique_asset_ids)} unique token IDs from {len(markets)} monitored markets")
            return unique_asset_ids
            
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
    
    async def periodic_market_check(self):
        """Periodic check for new markets to monitor and update WebSocket subscriptions"""
        while self.running:
            try:
                # Wait configured interval between checks
                await asyncio.sleep(config.MARKET_CHECK_INTERVAL)
                
                # Get current monitored asset IDs
                new_asset_ids = await self.get_all_monitored_asset_ids()
                
                if not new_asset_ids:
                    logger.debug("No monitored asset IDs found during periodic check - staying in idle mode")
                    continue
                
                # Check if we have WebSocket client and if asset IDs have changed
                current_subscriptions = getattr(websocket_client, 'subscriptions', {}).get('market', [])
                
                # If no current subscriptions but we have new assets, start WebSocket
                if not current_subscriptions and new_asset_ids:
                    logger.info(f"Found {len(new_asset_ids)} assets to monitor - starting WebSocket from idle mode")
                    try:
                        # Get API credentials from market monitor's CLOB client
                        api_creds = None
                        if market_monitor.clob_client:
                            try:
                                logger.info("Using CLOB client API credentials for WebSocket")
                            except Exception as e:
                                logger.warning(f"Could not get API credentials: {e}")
                        
                        # Start WebSocket client with reconnection loop
                        websocket_task = asyncio.create_task(
                            websocket_client.reconnect_loop(
                                new_asset_ids, 
                                self.main_message_handler,
                                api_creds=api_creds,
                                max_retries=10
                            )
                        )
                        self.tasks.append(websocket_task)
                        logger.info(f"WebSocket started from idle mode with {len(new_asset_ids)} assets")
                        continue
                    except Exception as e:
                        logger.error(f"Failed to start WebSocket from idle mode: {e}")
                        continue
                
                # Compare current subscriptions with new asset IDs
                if set(new_asset_ids) != set(current_subscriptions):
                    added_assets = set(new_asset_ids) - set(current_subscriptions)
                    removed_assets = set(current_subscriptions) - set(new_asset_ids)
                    
                    logger.info(f"Market changes detected - Added: {len(added_assets)}, Removed: {len(removed_assets)}")
                    
                    if added_assets:
                        logger.info(f"New assets to monitor: {list(added_assets)[:5]}...")
                    if removed_assets:
                        logger.info(f"Assets no longer monitored: {list(removed_assets)[:5]}...")
                    
                    # Update WebSocket subscriptions with new asset list by reconnecting
                    try:
                        success = await websocket_client.update_market_subscriptions(new_asset_ids)
                        if success:
                            logger.info(f"Successfully reinitialized WebSocket with {len(new_asset_ids)} assets")
                        else:
                            logger.error("Failed to reinitialize WebSocket with new assets")
                    except Exception as e:
                        logger.error(f"Failed to update WebSocket subscriptions: {e}")
                else:
                    logger.debug(f"No changes in monitored markets ({len(new_asset_ids)} assets)")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic market check: {e}")
    
    async def start(self):
        """Start the market maker"""
        try:
            logger.info("Starting Polymarket Market Maker...")
            self.running = True
            
            # Connect to database
            if not db_client.connect():
                logger.error("Failed to connect to database")
                return False
            
            # Connect to RabbitMQ
            if not await rabbitmq_client.connect():
                logger.error("Failed to connect to RabbitMQ")
                return False
            
            # Setup command handlers
            rabbitmq_client.add_command_handler("restart", self.handle_restart_command)
            
            # Start RabbitMQ command listener
            rabbitmq_task = asyncio.create_task(rabbitmq_client.start_command_listener())
            self.tasks.append(rabbitmq_task)
            
            # Initialize market monitor with proper CLOB client
            private_key = os.getenv('WALLET_PRIVATE_KEY')
            if not await market_monitor.initialize(private_key):
                logger.error("Failed to initialize market monitor")
                return False
            
            # Get all asset IDs to monitor
            asset_ids = await self.get_all_monitored_asset_ids()
            
            if not asset_ids:
                logger.warning("No asset IDs found to monitor at startup - service will run in idle mode and check periodically")
            else:
                logger.info(f"Monitoring {len(asset_ids)} assets")
            
            # Start periodic cleanup task
            cleanup_task = asyncio.create_task(self.periodic_cleanup())
            self.tasks.append(cleanup_task)
            
            # Start periodic market check task
            market_check_task = asyncio.create_task(self.periodic_market_check())
            self.tasks.append(market_check_task)
            
            # Get API credentials from market monitor's CLOB client
            api_creds = None
            if market_monitor.clob_client:
                try:
                    # The API credentials should already be set in the client
                    logger.info("Using CLOB client API credentials for WebSocket")
                except Exception as e:
                    logger.warning(f"Could not get API credentials: {e}")
            
            # Start WebSocket client only if we have assets to monitor
            if asset_ids:
                websocket_task = asyncio.create_task(
                    websocket_client.reconnect_loop(
                        asset_ids, 
                        self.main_message_handler,
                        api_creds=api_creds,
                        max_retries=10
                    )
                )
                self.tasks.append(websocket_task)
            else:
                logger.info("No WebSocket connection started - waiting for markets to be added")
            
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
            
            # Disconnect from RabbitMQ
            await rabbitmq_client.disconnect()
            
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