#!/usr/bin/env python3
"""
Check current USDC allowances for Polymarket contracts

This script checks your current USDC allowances for Polymarket trading contracts
without making any transactions.
"""

import os
import sys
from decimal import Decimal
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account

# Contract addresses
POLYGON_RPC_URL = "https://polygon-rpc.com/"
USDC_CONTRACT_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
CTF_EXCHANGE_ADDRESS = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"

# Simplified ERC-20 ABI
ERC20_ABI = [
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
    }
]

def check_allowances(wallet_address: str):
    """Check current allowances for a wallet"""
    
    # Connect to Polygon
    w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    
    if not w3.is_connected():
        print("❌ Failed to connect to Polygon network")
        return
    
    print(f"✅ Connected to Polygon (Chain ID: {w3.eth.chain_id})")
    
    # Initialize USDC contract
    usdc_contract = w3.eth.contract(
        address=Web3.to_checksum_address(USDC_CONTRACT_ADDRESS),
        abi=ERC20_ABI
    )
    
    checksum_address = Web3.to_checksum_address(wallet_address)
    
    try:
        # Get USDC balance
        balance_wei = usdc_contract.functions.balanceOf(checksum_address).call()
        decimals = usdc_contract.functions.decimals().call()
        balance_usdc = Decimal(balance_wei) / Decimal(10 ** decimals)
        
        # Get CTF Exchange allowance
        ctf_allowance_wei = usdc_contract.functions.allowance(
            checksum_address, 
            Web3.to_checksum_address(CTF_EXCHANGE_ADDRESS)
        ).call()
        ctf_allowance_usdc = Decimal(ctf_allowance_wei) / Decimal(10 ** decimals)
        
        print("\n" + "=" * 60)
        print("📊 WALLET STATUS")
        print("=" * 60)
        print(f"🔐 Address: {checksum_address}")
        print(f"💵 USDC Balance: {balance_usdc:,.6f} USDC")
        print()
        print("📋 ALLOWANCES")
        print("-" * 60)
        print(f"🏛️  CTF Exchange: {ctf_allowance_usdc:,.6f} USDC")
        
        # Check if unlimited
        max_uint = 2**256 - 1
        if ctf_allowance_wei == max_uint:
            print("   └── ♾️  UNLIMITED")
        elif ctf_allowance_usdc > 0:
            print("   └── ✅ APPROVED")
        else:
            print("   └── ❌ NOT APPROVED")
        
        print()
        
        # Status summary
        if ctf_allowance_usdc > 0:
            print("✅ Ready to trade on Polymarket!")
        else:
            print("⚠️  You need to set allowances before trading.")
            print("   Run: python set_allowance.py")
        
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error checking allowances: {e}")

def main():
    """Main function"""
    print("🔍 Polymarket Allowance Checker")
    print("=" * 40)
    
    # Get wallet address
    wallet_address = os.getenv('WALLET_ADDRESS')
    
    if not wallet_address:
        wallet_address = input("Enter wallet address: ").strip()
        
        if not wallet_address:
            print("❌ Wallet address is required")
            sys.exit(1)
    
    # Validate address format
    if not Web3.is_address(wallet_address):
        print("❌ Invalid wallet address format")
        sys.exit(1)
    
    check_allowances(wallet_address)

if __name__ == "__main__":
    main()