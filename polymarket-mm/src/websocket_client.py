import asyncio
import json
import logging
import websockets
from typing import Dict, List, Callable, Any, Optional
from datetime import datetime
from src.config import config

logger = logging.getLogger(__name__)

class PolymarketWebSocketClient:
    def __init__(self):
        self.websocket = None
        self.running = False
        self.subscriptions: Dict[str, List[str]] = {}
        self.message_handlers: List[Callable] = []
        
    async def connect(self) -> bool:
        """Connect to Polymarket WebSocket"""
        try:
            logger.info(f"Connecting to WebSocket: {config.POLYMARKET_WSS_URL}")
            
            # Create WebSocket connection
            self.websocket = await websockets.connect(
                config.POLYMARKET_WSS_URL,
                ping_interval=20,
                ping_timeout=10
            )
            
            logger.info("Connected to Polymarket WebSocket")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            return False
    
    async def authenticate(self) -> bool:
        """Authenticate with the WebSocket server"""
        try:
            if not config.POLYMARKET_API_KEY or not config.POLYMARKET_SECRET or not config.POLYMARKET_PASSPHRASE:
                logger.warning("API credentials not provided, skipping authentication")
                return True
            
            auth_message = {
                "type": "auth",
                "apiKey": config.POLYMARKET_API_KEY,
                "secret": config.POLYMARKET_SECRET,
                "passphrase": config.POLYMARKET_PASSPHRASE,
                "timestamp": str(int(datetime.utcnow().timestamp()))
            }
            
            await self.send_message(auth_message)
            logger.info("Authentication message sent")
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    async def subscribe_to_market_channel(self, asset_ids: List[str]) -> bool:
        """Subscribe to market channel for specific asset IDs"""
        try:
            subscription_message = {
                "type": "subscribe",
                "channel": "market",
                "asset_ids": asset_ids
            }
            
            await self.send_message(subscription_message)
            
            # Store subscription info
            self.subscriptions["market"] = asset_ids
            
            logger.info(f"Subscribed to market channel for {len(asset_ids)} assets")
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
    
    async def handle_message(self, message: Dict[str, Any]):
        """Handle incoming message from WebSocket"""
        try:
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
                
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def listen(self):
        """Listen for incoming WebSocket messages"""
        try:
            if not self.websocket:
                raise Exception("WebSocket not connected")
            
            self.running = True
            logger.info("Starting WebSocket message listener")
            
            async for message_str in self.websocket:
                try:
                    message = json.loads(message_str)
                    await self.handle_message(message)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON message: {e}")
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
    
    async def start_with_subscriptions(self, asset_ids: List[str], message_handler: Callable):
        """Start WebSocket client with market subscriptions"""
        try:
            # Connect to WebSocket
            if not await self.connect():
                return False
            
            # Authenticate if credentials are provided
            if not await self.authenticate():
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
            
            if self.websocket:
                await self.websocket.close()
                self.websocket = None
                logger.info("WebSocket connection closed")
                
        except Exception as e:
            logger.error(f"Error closing WebSocket: {e}")
    
    async def reconnect_loop(self, asset_ids: List[str], message_handler: Callable, max_retries: int = 5):
        """Reconnect loop with exponential backoff"""
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                logger.info(f"Attempting to connect (attempt {retry_count + 1}/{max_retries})")
                
                if await self.start_with_subscriptions(asset_ids, message_handler):
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