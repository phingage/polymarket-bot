import asyncio
import json
import logging
import websockets
import threading
import time
from typing import Dict, List, Callable, Any, Optional
from datetime import datetime, timezone
from src.config import config

logger = logging.getLogger(__name__)

class PolymarketWebSocketClient:
    def __init__(self):
        self.websocket = None
        self.running = False
        self.subscriptions: Dict[str, List[str]] = {}
        self.message_handlers: List[Callable] = []
        self.ping_task = None
        
    async def connect(self) -> bool:
        """Connect to Polymarket WebSocket"""
        try:
            logger.info(f"Connecting to WebSocket: {config.POLYMARKET_WSS_URL}")
            
            # Create WebSocket connection with proper URL and headers
            self.websocket = await websockets.connect(
                config.POLYMARKET_WSS_URL,
                ping_interval=None,  # Disable automatic ping
                ping_timeout=None,   # Disable automatic ping timeout
                extra_headers={
                    "User-Agent": "polymarket-mm/1.0"
                }
            )
            
            logger.info("Connected to Polymarket WebSocket")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            return False
    
    async def authenticate(self, api_creds=None) -> bool:
        """Authenticate with the WebSocket server using CLOB API credentials"""
        try:
            # Use provided credentials or try to get from config
            if api_creds:
                api_key = api_creds.api_key
                api_secret = api_creds.api_secret
                api_passphrase = api_creds.api_passphrase
            else:
                # Fallback to config (though this might not work with new auth method)
                api_key = getattr(config, 'POLYMARKET_API_KEY', None)
                api_secret = getattr(config, 'POLYMARKET_SECRET', None)
                api_passphrase = getattr(config, 'POLYMARKET_PASSPHRASE', None)
            
            if not (api_key and api_secret and api_passphrase):
                logger.warning("API credentials not provided, skipping authentication")
                return True
            
            # Use the correct authentication format for Polymarket CLOB
            auth_message = {
                "type": "auth",
                "apiKey": api_key,
                "secret": api_secret,
                "passphrase": api_passphrase,
                "timestamp": str(int(datetime.now(timezone.utc).timestamp()))
            }
            
            await self.send_message(auth_message)
            logger.info(f"Authentication message sent with API key: {api_key}")
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    async def subscribe_to_market_channel(self, asset_ids: List[str]) -> bool:
        """Subscribe to market channel for specific asset IDs"""
        try:
            # Use the correct format from Polymarket documentation
            subscription_message = {
                "assets_ids": asset_ids,  # Note: assets_ids not asset_ids
                "type": "market"
            }
            
            await self.send_message(subscription_message)
            
            # Store subscription info
            self.subscriptions["market"] = asset_ids
            
            logger.info(f"Subscribed to market channel for {len(asset_ids)} assets: {asset_ids[:5]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to subscribe to market channel: {e}")
            return False
    
    async def send_message(self, message: Dict[str, Any]):
        """Send message to WebSocket"""
        if not self.websocket:
            raise Exception("WebSocket not connected")
        
        message_str = json.dumps(message)
        await self.websocket.send(message_str)
        logger.debug(f"Sent message: {message_str}")
    
    def add_message_handler(self, handler: Callable):
        """Add a message handler function"""
        self.message_handlers.append(handler)
    
    async def handle_message(self, message):
        """Handle incoming message from WebSocket"""
        try:
            # Check if message is a list (market data updates)
            if isinstance(message, list):
                # Handle each item in the list
                for item in message:
                    await self.handle_market_update(item)
                return
            
            # Handle dict messages (control messages)
            if isinstance(message, dict):
                message_type = message.get("type")
                
                if message_type == "book":
                    # Handle book update
                    for handler in self.message_handlers:
                        try:
                            await handler(message)
                        except Exception as e:
                            logger.error(f"Error in message handler: {e}")
                
                elif message_type == "ping":
                    # Respond to ping with pong
                    await self.send_message({"type": "pong"})
                    logger.debug("Responded to ping with pong")
                
                elif message_type == "auth_success":
                    logger.info("WebSocket authentication successful")
                
                elif message_type == "auth_error":
                    logger.error(f"WebSocket authentication failed: {message.get('error')}")
                
                elif message_type == "subscription_success":
                    channel = message.get("channel")
                    logger.info(f"Successfully subscribed to {channel} channel")
                
                elif message_type == "subscription_error":
                    channel = message.get("channel")
                    error = message.get("error")
                    logger.error(f"Subscription failed for {channel} channel: {error}")
                
                else:
                    logger.debug(f"Received message type: {message_type}")
            else:
                logger.debug(f"Received unknown message format: {type(message)}")
                
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def handle_market_update(self, item: Dict[str, Any]):
        """Handle individual market update item"""
        try:
            asset_id = item.get('asset_id')
            event_type = item.get('event_type')
            market = item.get('market')
            timestamp = item.get('timestamp')
            
            logger.debug(f"Market update - Asset: {asset_id}, Event: {event_type}")
            
            # Handle different event types according to Polymarket documentation
            if event_type == 'book':
                await self.handle_book_event(item)
            elif event_type == 'price_change':
                await self.handle_price_change_event(item)
            elif event_type == 'tick_size_change':
                await self.handle_tick_size_change_event(item)
            elif event_type == 'last_trade_price':
                await self.handle_last_trade_price_event(item)
            else:
                logger.warning(f"Unknown event type: {event_type} for asset {asset_id}")
                
        except Exception as e:
            logger.error(f"Error handling market update: {e}")
    
    async def handle_book_event(self, item: Dict[str, Any]):
        """Handle book event - full orderbook snapshot"""
        try:
            asset_id = item.get('asset_id')
            market = item.get('market')
            timestamp = item.get('timestamp')
            hash_value = item.get('hash')
            bids = item.get('bids', [])
            asks = item.get('asks', [])
            
            # Convert to standardized book format
            book_message = {
                'type': 'book',
                'asset_id': asset_id,
                'market': market,
                'timestamp': timestamp,
                'event_type': 'book',
                'hash': hash_value,
                'bids': bids,
                'asks': asks,
                'spread': None,
                'sequence': None,
                'last_update_id': hash_value
            }
            
            # Calculate spread if both bids and asks exist
            if bids and asks:
                best_bid = float(bids[0].get('price', 0)) if bids else 0
                best_ask = float(asks[0].get('price', 0)) if asks else 0
                if best_bid > 0 and best_ask > 0:
                    book_message['spread'] = best_ask - best_bid
            
            logger.info(f"Book snapshot - Asset: {asset_id}, Bids: {len(bids)}, Asks: {len(asks)}")
            
            # Call message handlers
            for handler in self.message_handlers:
                try:
                    await handler(book_message)
                except Exception as e:
                    logger.error(f"Error in book handler for asset {asset_id}: {e}")
                    
        except Exception as e:
            logger.error(f"Error handling book event: {e}")
    
    async def handle_price_change_event(self, item: Dict[str, Any]):
        """Handle price_change event - order book updates"""
        try:
            asset_id = item.get('asset_id')
            market = item.get('market')
            timestamp = item.get('timestamp')
            changes = item.get('changes', [])
            
            # Convert changes to bids/asks format
            bids = []
            asks = []
            
            for change in changes:
                if isinstance(change, dict):
                    side = change.get('side')
                    price = change.get('price')
                    size = change.get('size')
                    
                    if side and price is not None and size is not None:
                        order_info = {'price': str(price), 'size': str(size)}
                        if side.lower() in ['buy', 'bid']:
                            bids.append(order_info)
                        elif side.lower() in ['sell', 'ask']:
                            asks.append(order_info)
            
            book_message = {
                'type': 'book',
                'asset_id': asset_id,
                'market': market,
                'timestamp': timestamp,
                'event_type': 'price_change',
                'changes': changes,
                'bids': bids,
                'asks': asks,
                'spread': None,
                'sequence': None,
                'last_update_id': None
            }
            
            logger.debug(f"Price change - Asset: {asset_id}, Changes: {len(changes)}, Bids: {len(bids)}, Asks: {len(asks)}")
            
            # Call message handlers
            for handler in self.message_handlers:
                try:
                    await handler(book_message)
                except Exception as e:
                    logger.error(f"Error in price change handler for asset {asset_id}: {e}")
                    
        except Exception as e:
            logger.error(f"Error handling price change event: {e}")
    
    async def handle_tick_size_change_event(self, item: Dict[str, Any]):
        """Handle tick_size_change event"""
        try:
            asset_id = item.get('asset_id')
            market = item.get('market')
            timestamp = item.get('timestamp')
            old_tick_size = item.get('old_tick_size')
            new_tick_size = item.get('new_tick_size')
            
            logger.info(f"Tick size change - Asset: {asset_id}, Old: {old_tick_size}, New: {new_tick_size}")
            
            # Create message for tick size change
            tick_message = {
                'type': 'tick_size_change',
                'asset_id': asset_id,
                'market': market,
                'timestamp': timestamp,
                'event_type': 'tick_size_change',
                'old_tick_size': old_tick_size,
                'new_tick_size': new_tick_size,
                'bids': [],
                'asks': [],
                'spread': None,
                'sequence': None,
                'last_update_id': None
            }
            
            # Call message handlers
            for handler in self.message_handlers:
                try:
                    await handler(tick_message)
                except Exception as e:
                    logger.error(f"Error in tick size change handler for asset {asset_id}: {e}")
                    
        except Exception as e:
            logger.error(f"Error handling tick size change event: {e}")
    
    async def handle_last_trade_price_event(self, item: Dict[str, Any]):
        """Handle last_trade_price event - trade execution"""
        try:
            asset_id = item.get('asset_id')
            market = item.get('market')
            timestamp = item.get('timestamp')
            price = item.get('price')
            side = item.get('side')
            size = item.get('size')
            
            logger.info(f"Trade executed - Asset: {asset_id}, Side: {side}, Price: {price}, Size: {size}")
            
            # Create message for trade
            trade_message = {
                'type': 'last_trade_price',
                'asset_id': asset_id,
                'market': market,
                'timestamp': timestamp,
                'event_type': 'last_trade_price',
                'price': price,
                'side': side,
                'size': size,
                'bids': [],
                'asks': [],
                'spread': None,
                'sequence': None,
                'last_update_id': None
            }
            
            # Call message handlers
            for handler in self.message_handlers:
                try:
                    await handler(trade_message)
                except Exception as e:
                    logger.error(f"Error in trade handler for asset {asset_id}: {e}")
                    
        except Exception as e:
            logger.error(f"Error handling last trade price event: {e}")
    
    async def send_ping(self):
        """Send periodic PING messages to keep connection alive"""
        while self.running and self.websocket:
            try:
                await asyncio.sleep(10)  # Send ping every 10 seconds
                if self.websocket and self.running:
                    await self.websocket.send("PING")
                    logger.debug("Sent PING to keep connection alive")
            except Exception as e:
                logger.error(f"Error sending ping: {e}")
                break
    
    async def listen(self):
        """Listen for incoming WebSocket messages"""
        try:
            if not self.websocket:
                raise Exception("WebSocket not connected")
            
            self.running = True
            logger.info("Starting WebSocket message listener")
            
            # Start ping task to keep connection alive
            self.ping_task = asyncio.create_task(self.send_ping())
            
            async for message_str in self.websocket:
                try:
                    # Handle both JSON messages and simple strings
                    if message_str == "PONG":
                        logger.debug("Received PONG response")
                        continue
                    
                    try:
                        message = json.loads(message_str)
                        await self.handle_message(message)
                    except json.JSONDecodeError:
                        # Handle non-JSON messages
                        logger.debug(f"Received non-JSON message: {message_str}")
                        if message_str == "PING":
                            await self.websocket.send("PONG")
                            logger.debug("Responded to PING with PONG")
                    
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                
                if not self.running:
                    break
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning("WebSocket connection closed")
        except Exception as e:
            logger.error(f"Error in WebSocket listener: {e}")
        finally:
            self.running = False
            if self.ping_task:
                self.ping_task.cancel()
    
    async def start_with_subscriptions(self, asset_ids: List[str], message_handler: Callable, api_creds=None):
        """Start WebSocket client with market subscriptions"""
        try:
            # Connect to WebSocket
            if not await self.connect():
                return False
            
            # Authenticate with provided credentials
            if not await self.authenticate(api_creds):
                logger.warning("Authentication failed, continuing without auth")
            
            # Add message handler
            self.add_message_handler(message_handler)
            
            # Wait a bit for authentication to complete
            await asyncio.sleep(1)
            
            # Subscribe to market channel
            if not await self.subscribe_to_market_channel(asset_ids):
                return False
            
            # Start listening for messages
            await self.listen()
            
            return True
            
        except Exception as e:
            logger.error(f"Error starting WebSocket client: {e}")
            return False
    
    async def close(self):
        """Close WebSocket connection"""
        try:
            self.running = False
            
            # Cancel ping task
            if self.ping_task:
                self.ping_task.cancel()
                try:
                    await self.ping_task
                except asyncio.CancelledError:
                    pass
            
            if self.websocket:
                await self.websocket.close()
                self.websocket = None
                logger.info("WebSocket connection closed")
                
        except Exception as e:
            logger.error(f"Error closing WebSocket: {e}")
    
    async def reconnect_loop(self, asset_ids: List[str], message_handler: Callable, api_creds=None, max_retries: int = 5):
        """Reconnect loop with exponential backoff"""
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                logger.info(f"Attempting to connect (attempt {retry_count + 1}/{max_retries})")
                
                if await self.start_with_subscriptions(asset_ids, message_handler, api_creds):
                    retry_count = 0  # Reset retry count on successful connection
                else:
                    retry_count += 1
                    
            except Exception as e:
                logger.error(f"Connection attempt failed: {e}")
                retry_count += 1
            
            if retry_count < max_retries:
                # Exponential backoff: 2^retry_count seconds
                delay = min(2 ** retry_count, 60)  # Cap at 60 seconds
                logger.info(f"Reconnecting in {delay} seconds...")
                await asyncio.sleep(delay)
            
        logger.error(f"Max reconnection attempts ({max_retries}) reached")

# Create WebSocket client instance
websocket_client = PolymarketWebSocketClient()