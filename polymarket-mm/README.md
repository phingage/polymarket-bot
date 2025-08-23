# Polymarket Market Maker

A Python application that monitors Polymarket markets and collects real-time book data using WebSocket connections.

## Features

- **MongoDB Integration**: Fetches monitored markets from MongoDB database
- **Real-time Data Collection**: Uses WebSocket to collect live book data from Polymarket
- **Data Storage**: Stores book data (bids, asks, spreads) in MongoDB for analysis
- **Automatic Reconnection**: Handles connection failures with exponential backoff
- **Data Cleanup**: Automatically cleans up old book data to manage storage
- **Configurable**: Environment-based configuration for easy deployment

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MongoDB       │    │  Market Maker    │    │  Polymarket     │
│                 │◄───┤  Application     ├───►│  WebSocket      │
│ - Markets       │    │                  │    │  (Book Data)    │
│ - Book Data     │    │ - Monitor        │    │                 │
└─────────────────┘    │ - Collect        │    └─────────────────┘
                       │ - Store          │
                       └──────────────────┘
```

## Installation

1. Create a virtual environment:
```bash
cd polymarket-mm
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Configuration

Create a `.env` file with the following configuration:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/
MONGO_DB=polymarket_bot
MONGO_COLLECTION=markets
BOOK_DATA_COLLECTION=book_data

# Polymarket API Configuration (optional for WebSocket)
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_SECRET=your_secret_here
POLYMARKET_PASSPHRASE=your_passphrase_here

# WebSocket Configuration
POLYMARKET_WSS_URL=wss://ws-subscriptions-clob.polymarket.com/ws/

# Application Configuration
LOG_LEVEL=INFO
UPDATE_INTERVAL=1
```

## Usage

Run the market maker:
```bash
python main.py
```

The application will:
1. Connect to MongoDB and fetch all monitored markets
2. Extract asset IDs from monitored markets  
3. Connect to Polymarket WebSocket
4. Subscribe to real-time book data for all monitored assets
5. Store incoming book data in MongoDB
6. Automatically handle reconnections and cleanup

## Database Schema

### Markets Collection
Markets with `monitored: true` will be tracked for book data collection.

### Book Data Collection
```json
{
  "market_id": "string",
  "asset_id": "string", 
  "timestamp": "datetime",
  "book_data": {
    "bids": [{"price": "0.52", "size": "100"}],
    "asks": [{"price": "0.53", "size": "50"}],
    "spread": "0.01",
    "mid_price": "0.525",
    "last_updated": "2024-01-01T12:00:00Z"
  },
  "created_at": "datetime"
}
```

## Monitoring

The application logs to both console and `polymarket_mm.log` file. Monitor the logs for:
- Connection status
- Market subscription updates
- Data collection statistics
- Error messages and reconnection attempts

## API Integration

The application integrates with:
- **Polymarket WebSocket**: Real-time book data via `wss://ws-subscriptions-clob.polymarket.com/ws/`
- **py-clob-client**: Official Polymarket Python client library
- **MongoDB**: Data storage and market configuration

## Development

### Project Structure
```
polymarket-mm/
├── main.py              # Main application entry point
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── .env.example        # Environment configuration template
└── src/
    ├── __init__.py
    ├── config.py        # Configuration management
    ├── database.py      # MongoDB operations
    ├── market_monitor.py # Market monitoring logic
    └── websocket_client.py # WebSocket client implementation
```

### Adding New Features

1. **New Data Types**: Extend the `book_data` schema in `database.py`
2. **Additional Markets**: Add market filtering logic in `market_monitor.py`
3. **Custom Handlers**: Add message handlers in `websocket_client.py`

## Troubleshooting

### Connection Issues
- Check MongoDB connection string in `.env`
- Verify Polymarket WebSocket URL is accessible
- Check firewall settings for outbound connections

### Missing Asset IDs
- Ensure monitored markets have `clobRewards` with asset IDs
- Check market data structure in MongoDB
- Review logs for asset ID extraction warnings

### Data Storage Issues
- Verify MongoDB write permissions
- Check disk space for database storage
- Monitor collection indexes for performance

## License

This project is for educational and development purposes. Please comply with Polymarket's Terms of Service and API usage policies.