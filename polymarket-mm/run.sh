#!/bin/bash

# Polymarket Market Maker Runner Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Polymarket Market Maker v1.0       ${NC}"
echo -e "${GREEN}======================================${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    python -m venv venv
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create virtual environment${NC}"
        exit 1
    fi
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to activate virtual environment${NC}"
    exit 1
fi

# Check if requirements are installed
echo -e "${YELLOW}Checking dependencies...${NC}"
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Environment file not found. Please copy .env.example to .env and configure it.${NC}"
    cp .env.example .env
    echo -e "${RED}Please edit .env file with your configuration and run again.${NC}"
    exit 1
fi

# Run the application
echo -e "${GREEN}Starting Polymarket Market Maker...${NC}"
python main.py

echo -e "${YELLOW}Application stopped.${NC}"