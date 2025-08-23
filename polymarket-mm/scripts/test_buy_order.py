#!/usr/bin/env python3
"""
Polymarket Test Buy Limit Order Script

This script places a real test buy limit order on Polymarket using the CLOB client.
Use this to test your trading setup with very low amounts.
"""

import os
import sys
from decimal import Decimal
from typing import Optional
from py_clob_client.client import ClobClient
from py_clob_client.constants import POLYGON
from py_clob_client.order_builder.constants import BUY
from py_clob_client.clob_types import OrderArgs, ApiCreds, BookParams, OrderType
import time

# Add parent directory to path to import from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Polygon Network Configuration
POLYGON_CHAIN_ID = 137

# Polymarket CLOB Configuration
HOST = "https://clob.polymarket.com"
CHAIN_ID = POLYGON

class PolymarketTestTrader:
    def __init__(self, private_key: str, funder_address: str):
        # Initialize CLOB client with Level 1 auth (private key only)
        self.client = ClobClient(
            host=HOST,
            chain_id=CHAIN_ID,
            key=private_key,
            signature_type=2,
            funder=funder_address
        )
        print(f"✅ Connected to Polymarket CLOB")
        print(f"🔐 Wallet address: {self.client.get_address()}")
        
        # Generate and set API credentials for Level 2 auth
        print("🔑 Generating API credentials...")
        try:
            api_creds = self.client.create_or_derive_api_creds()
            self.client.set_api_creds(api_creds)
            print("✅ API credentials set successfully!")
            print(f"📋 API Key: {api_creds.api_key}")
        except Exception as e:
            print(f"⚠️  Warning: Failed to set API credentials: {e}")
            print("Some features may be limited")
        
    def get_balance(self) -> dict:
        """Get wallet balances"""
        try:
            # Note: get_balance_allowance requires Level 2 auth (API credentials)
            # For now, we'll skip balance check or implement it differently
            return {"USDC": "Unknown - requires API credentials"}
        except Exception as e:
            raise Exception(f"Failed to get balances: {e}")
    
    def get_token_info(self, token_id: str) -> dict:
        """Get comprehensive token information using direct client methods"""
        try:
            # Get midpoint price
            midpoint = self.client.get_midpoint(token_id)
            
            # Get current buy price
            buy_price = self.client.get_price(token_id, side="BUY")
            
            # Get orderbook
            orderbook = self.client.get_order_book(token_id)
            
            # Get detailed orderbook using BookParams
            detailed_books = self.client.get_order_books([BookParams(token_id=token_id)])
            
            return {
                'token_id': token_id,
                'midpoint': midpoint,
                'buy_price': buy_price,
                'orderbook': orderbook,
                'detailed_books': detailed_books
            }
        except Exception as e:
            raise Exception(f"Failed to get token info: {e}")
    
    def create_buy_limit_order(self, token_id: str, price: Decimal, size: Decimal) -> dict:
        """Create and submit a buy limit order"""
        try:
            print("📝 Order details:")
            print(f"   Token ID: {token_id}")
            print(f"   Price: {price} USDC")
            print(f"   Size: {size} tokens")
            print(f"   Side: BUY")
            print(f"   Total Cost: {float(price) * float(size):.6f} USDC")
            
            # Create OrderArgs objec
            order_args = OrderArgs(
                token_id=token_id,
                price=float(price),
                size=float(size),
                side=BUY
            )
            
            print("\n🔄 Creating signed order...")
            
            # Create the signed order
            signed_order = self.client.create_order(order_args)
            
            print("🔄 Submitting order to Polymarket...")
            
            # Submit the order
            resp = self.client.post_order(signed_order, OrderType.GTC)

            if resp.get('success'):
                order_id = resp.get('orderID')
                print(f"✅ Order submitted successfully!")
                print(f"📋 Order ID: {order_id}")
                
                # Get the order details
                order_details = {
                    'order_id': order_id,
                    'token_id': token_id,
                    'price': str(price),
                    'size': str(size),
                    'side': 'BUY',
                    'response': resp
                }
                
                return order_details
            else:
                error_msg = resp.get('error', 'Unknown error')
                raise Exception(f"Order submission failed: {error_msg}")
            
        except Exception as e:
            raise Exception(f"Failed to create order: {e}")
    
    def show_token_summary(self, token_id: str):
        """Display token information and orderbook using direct client methods"""
        try:
            print(f"\n📊 Token Analysis: {token_id}")
            print("=" * 60)
            
            # Get comprehensive token info
            token_info = self.get_token_info(token_id)
            
            print(f"🏷️  Token ID: {token_id}")
            print(f"📊 Midpoint Price: {token_info.get('midpoint', 'N/A')}")
            print(f"💵 Current Buy Price: {token_info.get('buy_price', 'N/A')}")
            
            # Show orderbook
            orderbook = token_info.get('orderbook')
            if orderbook:
                bids = orderbook.bids[:5] if orderbook.bids else []  # Top 5 bids
                asks = orderbook.asks[:5] if orderbook.asks else []  # Top 5 asks
                
                print(f"\n📚 Orderbook:")
                if bids:
                    print("   Bids (buyers):")
                    for bid in bids:
                        print(f"      {bid.price} @ {bid.size}")
                else:
                    print("   Bids: None")
                
                if asks:
                    print("   Asks (sellers):")
                    for ask in asks:
                        print(f"      {ask.price} @ {ask.size}")
                else:
                    print("   Asks: None")
                
                # Show additional orderbook info
                print(f"\n📋 Market Info:")
                print(f"   Min Order Size: {orderbook.min_order_size}")
                print(f"   Tick Size: {orderbook.tick_size}")
                print(f"   Asset ID: {orderbook.asset_id}")
            else:
                print("📚 No orderbook data available")
            
        except Exception as e:
            print(f"❌ Error getting token info: {e}")
    
    def test_buy_order(self, token_id: str, test_price: Decimal = Decimal("0.01"), 
                      test_size: Decimal = Decimal("1.0")):
        """Test creating a buy limit order"""
        try:
            print("🧪 Polymarket Test Buy Order")
            print("=" * 60)
            
            # Show wallet info
            print(f"🔐 Wallet Address: {self.client.get_address()}")
            total_cost = float(test_price * test_size)
            print(f"💰 Order will cost: {total_cost:.6f} USDC")
            print("⚠️  Make sure you have sufficient USDC balance in your wallet")
            
            # Show token information
            self.show_token_summary(token_id)
            
            print(f"\n🎯 Target Token ID: {token_id}")
            
            # Create test order
            print(f"\n📋 Creating test buy order...")
            print(f"   💵 Price: {test_price} USDC per token")
            print(f"   📦 Size: {test_size} tokens")
            print(f"   💰 Total cost: {float(test_price * test_size):.6f} USDC")
            
            order = self.create_buy_limit_order(token_id, test_price, test_size)
            
            print(f"\n✅ Test order submitted successfully!")
            print("📋 Order Details:")
            for key, value in order.items():
                if key != 'response':
                    print(f"   {key}: {value}")
            
            # Check order status
            if order.get('order_id'):
                print(f"\n🔍 You can check your order status at:")
                print(f"   https://polymarket.com/profile/{self.client.get_address()}")
                
        except Exception as e:
            print(f"❌ Error creating test order: {e}")
            sys.exit(1)

def main():
    """Main function"""
    print("=" * 60)
    print("🧪 Polymarket Test Buy Limit Order (REAL ORDERS)")
    print("=" * 60)
    
    # Get private key from environment or user input
    private_key = os.getenv('WALLET_PRIVATE_KEY')
    
    if not private_key:
        print("🔑 Enter your wallet private key (will not be saved):")
        private_key = input().strip()
        
        if not private_key:
            print("❌ Private key is required")
            sys.exit(1)
    
    # Get funder address from environment or user input
    funder_address = os.getenv('POLYMARKET_FUNDER')
    
    if not funder_address:
        print("🏛️ Enter Polymarket funder address:")
        funder_address = input().strip()
        
        if not funder_address:
            print("❌ Funder address is required")
            sys.exit(1)
    
    
    # Get token ID
    token_id = input("\n🏷️ Enter token ID (e.g., '21742633143463906290569050155826241533067272736897614950488156847949938836455'): ").strip()
    if not token_id:
        print("❌ Token ID is required")
        sys.exit(1)
    
    # Get test price
    try:
        price_input = input("\n💵 Enter test price in USDC (default 0.01, max 0.99): ").strip()
        test_price = Decimal(price_input) if price_input else Decimal("0.01")
        if test_price <= 0 or test_price >= 1:
            print("❌ Price should be between 0 and 1")
            sys.exit(1)
    except ValueError:
        print("❌ Invalid price format")
        sys.exit(1)
    
    # Get test size
    try:
        size_input = input("\n📦 Enter test size in tokens (default 10.0): ").strip()
        test_size = Decimal(size_input) if size_input else Decimal("10.0")
        if test_size <= 0:
            print("❌ Size must be positive")
            sys.exit(1)
    except ValueError:
        print("❌ Invalid size format")
        sys.exit(1)
    
    # Calculate total cost
    total_cost = test_price * test_size
    print(f"\n💰 Total order cost: {float(total_cost):.6f} USDC")
    
    # Safety warnings
    print("\n⚠️  IMPORTANT WARNINGS:")
    print("   - This will place a REAL order on Polymarket")
    print("   - You will spend real USDC from your wallet")
    print("   - Make sure you have sufficient USDC balance")
    print("   - Use small amounts for testing")
    
    # Confirmation
    confirm = input(f"\n⚠️  Place REAL buy order for {test_size} tokens at {test_price} USDC each? (y/N): ").strip().lower()
    
    if confirm != 'y':
        print("❌ Operation cancelled")
        sys.exit(0)
    
    try:
        # Create test order
        trader = PolymarketTestTrader(private_key, funder_address)
        trader.test_buy_order(token_id, test_price, test_size)
        
    except Exception as e:
        print(f"❌ Failed to create test order: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()