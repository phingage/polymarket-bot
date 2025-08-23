import asyncio
import logging
import json
from typing import Dict, List, Set, Any, Optional
from datetime import datetime
from py_clob_client.client import ClobClient
from py_clob_client.constants import POLYGON
from src.database import db_client
from src.config import config

logger = logging.getLogger(__name__)

class MarketMonitor:
    def __init__(self):
        self.monitored_markets: Dict[str, Dict[str, Any]] = {}
        self.active_subscriptions: Set[str] = set()
        self.clob_client: Optional[ClobClient] = None
        self.running = False
        
    async def initialize(self):
        """Initialize the market monitor"""
        try:
            # Connect to database
            if not db_client.connect():
                raise Exception("Failed to connect to database")
            
            # Initialize Clob Client
            if config.POLYMARKET_API_KEY:
                self.clob_client = ClobClient(
                    host="https://clob.polymarket.com",
                    key=config.POLYMARKET_API_KEY,
                    chain_id=POLYGON
                )
                logger.info("Initialized Clob Client with API credentials")
            else:
                logger.warning("API credentials not provided, running in read-only mode")
                
            # Load monitored markets
            await self.refresh_monitored_markets()
            
            logger.info(f"MarketMonitor initialized with {len(self.monitored_markets)} markets")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize MarketMonitor: {e}")
            return False
    
    async def refresh_monitored_markets(self):
        """Refresh the list of monitored markets from database"""
        try:
            markets = db_client.get_monitored_markets()
            new_monitored = {}
            
            for market in markets:
                market_id = market.get('id') or str(market.get('_id'))
                new_monitored[market_id] = {
                    'question': market.get('question', 'Unknown'),
                    'outcomes': market.get('outcomes', []),
                    'outcomePrices': market.get('outcomePrices', []),
                    'slug': market.get('slug', ''),
                    'active': market.get('active', False),
                    'clob_rewards': market.get('clobRewards', [])
                }
            
            # Update monitored markets
            self.monitored_markets = new_monitored
            logger.info(f"Refreshed {len(self.monitored_markets)} monitored markets")
            
        except Exception as e:
            logger.error(f"Error refreshing monitored markets: {e}")
    
    def extract_asset_ids_from_market(self, market: Dict[str, Any]) -> List[str]:
        """Extract asset IDs from market data for WebSocket subscription"""
        asset_ids = []
        
        # Try to extract from clob_rewards if available
        clob_rewards = market.get('clob_rewards', [])
        for reward in clob_rewards:
            if 'asset_id' in reward:
                asset_ids.append(reward['asset_id'])
        
        # If no asset IDs found in rewards, try to derive from market structure
        # This might need adjustment based on actual Polymarket data structure
        outcomes = market.get('outcomes', [])
        if outcomes and not asset_ids:
            # Generate potential asset IDs based on market structure
            # This is a placeholder - actual implementation depends on Polymarket's ID system
            logger.warning(f"No asset IDs found in clob_rewards for market. Outcomes: {outcomes}")
        
        return asset_ids
    
    async def subscribe_to_market_books(self):
        """Subscribe to book data for all monitored markets using WebSocket"""
        try:
            if not self.clob_client:
                logger.error("Clob client not initialized")
                return
            
            all_asset_ids = []
            market_to_assets = {}
            
            # Collect all asset IDs from monitored markets
            for market_id, market_data in self.monitored_markets.items():
                asset_ids = self.extract_asset_ids_from_market(market_data)
                if asset_ids:
                    all_asset_ids.extend(asset_ids)
                    market_to_assets[market_id] = asset_ids
                else:
                    logger.warning(f"No asset IDs found for market {market_id}")
            
            if not all_asset_ids:
                logger.warning("No asset IDs found for WebSocket subscription")
                return
            
            logger.info(f"Subscribing to {len(all_asset_ids)} assets from {len(market_to_assets)} markets")
            
            # Create WebSocket subscription callback
            def on_book_update(message):
                self.handle_book_update(message, market_to_assets)
            
            # Subscribe to market channel with asset IDs
            # Note: This is a simplified example - actual implementation may vary
            # based on py-clob-client WebSocket API
            subscription_data = {
                "channel": "market",
                "asset_ids": all_asset_ids
            }
            
            # Start WebSocket connection
            # This is pseudo-code - actual implementation depends on py-clob-client API
            logger.info("Starting WebSocket subscription...")
            # await self.clob_client.websocket_subscribe(subscription_data, on_book_update)
            
        except Exception as e:
            logger.error(f"Error subscribing to market books: {e}")
    
    def handle_book_update(self, message: Dict[str, Any], market_to_assets: Dict[str, List[str]]):
        """Handle incoming book update from WebSocket"""
        try:
            asset_id = message.get('asset_id')
            if not asset_id:
                return
            
            # Find which market this asset belongs to
            market_id = None
            for mid, asset_list in market_to_assets.items():
                if asset_id in asset_list:
                    market_id = mid
                    break
            
            if not market_id:
                logger.warning(f"Received book update for unknown asset: {asset_id}")
                return
            
            # Extract book data
            book_data = {
                'bids': message.get('bids', []),
                'asks': message.get('asks', []),
                'spread': message.get('spread'),
                'mid_price': message.get('mid_price'),
                'last_updated': message.get('timestamp', datetime.utcnow().isoformat())
            }
            
            # Store in database
            success = db_client.store_book_data(market_id, asset_id, book_data)
            
            if success:
                logger.debug(f"Stored book data for market {market_id}, asset {asset_id}")
            else:
                logger.error(f"Failed to store book data for market {market_id}, asset {asset_id}")
                
        except Exception as e:
            logger.error(f"Error handling book update: {e}")
    
    async def run_periodic_refresh(self):
        """Periodically refresh monitored markets"""
        while self.running:
            try:
                await asyncio.sleep(60)  # Refresh every minute
                await self.refresh_monitored_markets()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic refresh: {e}")
    
    async def start(self):
        """Start the market monitor"""
        try:
            self.running = True
            logger.info("Starting MarketMonitor...")
            
            # Start periodic refresh task
            refresh_task = asyncio.create_task(self.run_periodic_refresh())
            
            # Subscribe to market books
            await self.subscribe_to_market_books()
            
            # Keep running
            await refresh_task
            
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        except Exception as e:
            logger.error(f"Error in MarketMonitor: {e}")
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop the market monitor"""
        try:
            self.running = False
            logger.info("Stopping MarketMonitor...")
            
            # Close WebSocket connections if any
            if self.clob_client:
                # Cleanup clob client connections
                pass
            
            # Disconnect from database
            db_client.disconnect()
            
            logger.info("MarketMonitor stopped")
            
        except Exception as e:
            logger.error(f"Error stopping MarketMonitor: {e}")

# Global market monitor instance
market_monitor = MarketMonitor()