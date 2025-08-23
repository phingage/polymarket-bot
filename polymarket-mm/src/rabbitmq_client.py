import asyncio
import json
import logging
from typing import Dict, Any, Callable, Optional
import aio_pika
from aio_pika import Message, ExchangeType
from src.config import config

logger = logging.getLogger(__name__)

class RabbitMQClient:
    def __init__(self):
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.exchange: Optional[aio_pika.Exchange] = None
        self.notification_queue: Optional[aio_pika.Queue] = None
        self.running = False
        self.command_handlers: Dict[str, Callable] = {}
        
    async def connect(self) -> bool:
        """Connect to RabbitMQ"""
        try:
            logger.info(f"Connecting to RabbitMQ: {config.RABBITMQ_URL}")
            
            # Establish connection
            self.connection = await aio_pika.connect_robust(config.RABBITMQ_URL)
            self.channel = await self.connection.channel()
            
            # Create exchange for topics
            self.exchange = await self.channel.declare_exchange(
                "polymarket", 
                ExchangeType.TOPIC,
                durable=True
            )
            
            # Create notification queue for commands
            self.notification_queue = await self.channel.declare_queue(
                config.RABBITMQ_NOTIFICATION_QUEUE,
                durable=True
            )
            
            logger.info("Connected to RabbitMQ successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from RabbitMQ"""
        try:
            self.running = False
            
            if self.connection and not self.connection.is_closed:
                await self.connection.close()
                logger.info("Disconnected from RabbitMQ")
                
        except Exception as e:
            logger.error(f"Error disconnecting from RabbitMQ: {e}")
    
    def add_command_handler(self, command: str, handler: Callable):
        """Add command handler for specific command"""
        self.command_handlers[command] = handler
        logger.info(f"Added command handler for: {command}")
    
    async def start_command_listener(self):
        """Start listening for commands on notification queue"""
        try:
            if not self.notification_queue:
                logger.error("Notification queue not initialized")
                return
            
            self.running = True
            logger.info(f"Starting command listener on queue: {config.RABBITMQ_NOTIFICATION_QUEUE}")
            
            async def process_command(message: aio_pika.IncomingMessage):
                async with message.process():
                    try:
                        # Decode message
                        body = message.body.decode()
                        logger.info(f"Received command: {body}")
                        
                        # Parse JSON
                        try:
                            command_data = json.loads(body)
                        except json.JSONDecodeError:
                            # Handle simple string commands
                            command_data = {"command": body.strip()}
                        
                        command = command_data.get("command")
                        if not command:
                            logger.warning(f"No command found in message: {body}")
                            return
                        
                        # Execute command handler
                        if command in self.command_handlers:
                            logger.info(f"Executing command: {command}")
                            try:
                                await self.command_handlers[command](command_data)
                                logger.info(f"Command executed successfully: {command}")
                            except Exception as e:
                                logger.error(f"Error executing command {command}: {e}")
                        else:
                            logger.warning(f"Unknown command: {command}")
                            
                    except Exception as e:
                        logger.error(f"Error processing command message: {e}")
            
            # Start consuming messages
            await self.notification_queue.consume(process_command)
            
        except Exception as e:
            logger.error(f"Error in command listener: {e}")
    
    async def publish_notification(self, routing_key: str, message: Dict[str, Any]):
        """Publish notification to topic exchange"""
        try:
            if not self.exchange:
                logger.error("Exchange not initialized")
                return False
            
            # Convert message to JSON
            message_body = json.dumps(message)
            
            # Create message
            rabbit_message = Message(
                message_body.encode(),
                content_type="application/json",
                timestamp=asyncio.get_event_loop().time()
            )
            
            # Publish to exchange with routing key
            await self.exchange.publish(
                rabbit_message,
                routing_key=routing_key
            )
            
            logger.debug(f"Published notification to {routing_key}: {message}")
            return True
            
        except Exception as e:
            logger.error(f"Error publishing notification: {e}")
            return False
    
    async def publish_market_notification(self, asset_id: str, event_type: str, data: Dict[str, Any]):
        """Publish market-related notification"""
        try:
            notification = {
                "asset_id": asset_id,
                "event_type": event_type,
                "data": data,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            # Use markets topic with asset_id as routing key
            routing_key = f"{config.RABBITMQ_MARKETS_TOPIC}.{asset_id}"
            
            return await self.publish_notification(routing_key, notification)
            
        except Exception as e:
            logger.error(f"Error publishing market notification: {e}")
            return False
    
    async def publish_heartbeat(self, heartbeat_data: Dict[str, Any]):
        """Publish heartbeat for service health monitoring"""
        try:
            routing_key = "service.heartbeat.polymarket-mm"
            return await self.publish_notification(routing_key, heartbeat_data)
        except Exception as e:
            logger.error(f"Error publishing heartbeat: {e}")
            return False

# Create global instance
rabbitmq_client = RabbitMQClient()