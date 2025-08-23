#!/usr/bin/env python3
"""
Polymarket USDC Allowance Setup Script

This script sets up the necessary USDC allowances for trading on Polymarket.
It approves the Polymarket CTF Exchange contract to spend USDC on behalf of your wallet.
"""

import os
import sys
from decimal import Decimal
from typing import Optional
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account import Account
import json

# Add parent directory to path to import from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.config import config

# Polygon Network Configuration
POLYGON_RPC_URL = "https://polygon-rpc.com/"
POLYGON_CHAIN_ID = 137

# Contract Addresses on Polygon
USDC_CONTRACT_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"  # USDC.e on Polygon
CTF_EXCHANGE_ADDRESS = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"     # Polymarket CTF Exchange
CTF_CONTRACT_ADDRESS = "0x4d97dcd97ec945f40cf65f87097ace5ea0476045"     # Conditional Tokens Framework

# ERC-20 Token ABI (simplified for approve function)
ERC20_ABI = [
    {
        "constant": False,
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    }
]

class PolymarketAllowanceManager:
    def __init__(self):
        # Initialize Web3 connection
        self.w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL))
        
        # Add PoA middleware for Polygon
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        
        # Verify connection
        if not self.w3.is_connected():
            raise Exception("Failed to connect to Polygon network")
        
        print(f"✅ Connected to Polygon network (Chain ID: {self.w3.eth.chain_id})")
        
        # Initialize contracts
        self.usdc_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(USDC_CONTRACT_ADDRESS),
            abi=ERC20_ABI
        )
        
        print(f"📄 USDC Contract: {USDC_CONTRACT_ADDRESS}")
        print(f"📄 CTF Exchange: {CTF_EXCHANGE_ADDRESS}")
        
    def load_wallet_from_private_key(self, private_key: str) -> Account:
        """Load wallet from private key"""
        try:
            account = Account.from_key(private_key)
            print(f"🔐 Loaded wallet: {account.address}")
            return account
        except Exception as e:
            raise Exception(f"Failed to load wallet from private key: {e}")
    
    def get_usdc_balance(self, address: str) -> tuple[Decimal, int]:
        """Get USDC balance for an address"""
        try:
            checksum_address = Web3.to_checksum_address(address)
            
            # Get balance in wei (smallest unit)
            balance_wei = self.usdc_contract.functions.balanceOf(checksum_address).call()
            
            # Get decimals (USDC has 6 decimals)
            decimals = self.usdc_contract.functions.decimals().call()
            
            # Convert to human readable format
            balance_human = Decimal(balance_wei) / Decimal(10 ** decimals)
            
            return balance_human, balance_wei
            
        except Exception as e:
            raise Exception(f"Failed to get USDC balance: {e}")
    
    def get_current_allowance(self, owner_address: str, spender_address: str) -> tuple[Decimal, int]:
        """Get current allowance for a spender"""
        try:
            owner_checksum = Web3.to_checksum_address(owner_address)
            spender_checksum = Web3.to_checksum_address(spender_address)
            
            # Get allowance in wei
            allowance_wei = self.usdc_contract.functions.allowance(
                owner_checksum, 
                spender_checksum
            ).call()
            
            # Get decimals
            decimals = self.usdc_contract.functions.decimals().call()
            
            # Convert to human readable format
            allowance_human = Decimal(allowance_wei) / Decimal(10 ** decimals)
            
            return allowance_human, allowance_wei
            
        except Exception as e:
            raise Exception(f"Failed to get current allowance: {e}")
    
    def approve_spending(self, account: Account, spender_address: str, amount_usdc: Optional[Decimal] = None) -> str:
        """Approve spending for a contract"""
        try:
            spender_checksum = Web3.to_checksum_address(spender_address)
            
            # If no amount specified, approve maximum amount
            if amount_usdc is None:
                # Use maximum uint256 value for unlimited approval
                amount_wei = 2**256 - 1
                print(f"💰 Approving unlimited USDC spending for {spender_checksum}")
            else:
                # Convert USDC amount to wei (6 decimals)
                amount_wei = int(amount_usdc * Decimal(10 ** 6))
                print(f"💰 Approving {amount_usdc} USDC spending for {spender_checksum}")
            
            # Build transaction
            transaction = self.usdc_contract.functions.approve(
                spender_checksum,
                amount_wei
            ).build_transaction({
                'from': account.address,
                'gas': 100000,  # Standard gas limit for approve
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(account.address),
                'chainId': POLYGON_CHAIN_ID
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, account.key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            print(f"📤 Transaction sent: {tx_hash.hex()}")
            print(f"🔗 View on PolygonScan: https://polygonscan.com/tx/{tx_hash.hex()}")
            
            # Wait for transaction receipt
            print("⏳ Waiting for transaction confirmation...")
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
            
            if receipt.status == 1:
                print("✅ Transaction confirmed!")
                return tx_hash.hex()
            else:
                raise Exception("Transaction failed")
                
        except Exception as e:
            raise Exception(f"Failed to approve spending: {e}")
    
    def setup_polymarket_allowances(self, private_key: str, amount_usdc: Optional[Decimal] = None):
        """Setup all necessary allowances for Polymarket trading"""
        try:
            print("🚀 Setting up Polymarket allowances...")
            print("=" * 60)
            
            # Load wallet
            account = self.load_wallet_from_private_key(private_key)
            
            # Check USDC balance
            balance_human, balance_wei = self.get_usdc_balance(account.address)
            print(f"💵 USDC Balance: {balance_human}")
            
            if balance_human == 0:
                print("⚠️  Warning: You have 0 USDC balance. You need USDC to trade on Polymarket.")
            
            # Check current CTF Exchange allowance
            current_allowance, _ = self.get_current_allowance(
                account.address, 
                CTF_EXCHANGE_ADDRESS
            )
            print(f"📋 Current CTF Exchange allowance: {current_allowance} USDC")
            
            # Set allowance for CTF Exchange (main trading contract)
            if amount_usdc is None or current_allowance < amount_usdc:
                print("\n🔄 Setting up CTF Exchange allowance...")
                tx_hash = self.approve_spending(account, CTF_EXCHANGE_ADDRESS, amount_usdc)
                
                # Verify new allowance
                new_allowance, _ = self.get_current_allowance(
                    account.address, 
                    CTF_EXCHANGE_ADDRESS
                )
                print(f"✅ New CTF Exchange allowance: {new_allowance} USDC")
            else:
                print("✅ CTF Exchange allowance already sufficient")
            
            print("\n" + "=" * 60)
            print("🎉 Polymarket allowances setup complete!")
            print("📝 You can now trade on Polymarket using your wallet")
            print("🔗 Visit: https://polymarket.com")
            
        except Exception as e:
            print(f"❌ Error setting up allowances: {e}")
            sys.exit(1)

def main():
    """Main function"""
    print("=" * 60)
    print("🏛️  Polymarket USDC Allowance Setup")
    print("=" * 60)
    
    # Get private key from environment or user input
    private_key = os.getenv('WALLET_PRIVATE_KEY')
    
    if not private_key:
        print("🔑 Enter your wallet private key (will not be saved):")
        private_key = input().strip()
        
        if not private_key:
            print("❌ Private key is required")
            sys.exit(1)
    
    # Get amount (optional)
    amount_input = input("\n💰 Enter USDC amount to approve (leave empty for unlimited): ").strip()
    
    amount_usdc = None
    if amount_input:
        try:
            amount_usdc = Decimal(amount_input)
            if amount_usdc <= 0:
                print("❌ Amount must be positive")
                sys.exit(1)
        except (ValueError, TypeError):
            print("❌ Invalid amount format")
            sys.exit(1)
    
    # Confirmation
    if amount_usdc:
        confirm = input(f"\n⚠️  Approve {amount_usdc} USDC spending for Polymarket? (y/N): ").strip().lower()
    else:
        confirm = input("\n⚠️  Approve unlimited USDC spending for Polymarket? (y/N): ").strip().lower()
    
    if confirm != 'y':
        print("❌ Operation cancelled")
        sys.exit(0)
    
    try:
        # Setup allowances
        manager = PolymarketAllowanceManager()
        manager.setup_polymarket_allowances(private_key, amount_usdc)
        
    except Exception as e:
        print(f"❌ Failed to setup allowances: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()