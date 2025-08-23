@echo off
setlocal enabledelayedexpansion

echo ======================================
echo   Polymarket Market Maker v1.0       
echo ======================================

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Creating...
    python -m venv venv
    
    if !errorlevel! neq 0 (
        echo Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

if !errorlevel! neq 0 (
    echo Failed to activate virtual environment
    pause
    exit /b 1
)

REM Check if requirements are installed
echo Checking dependencies...
pip install -r requirements.txt

if !errorlevel! neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo Environment file not found. Copying template...
    copy .env.example .env
    echo Please edit .env file with your configuration and run again.
    pause
    exit /b 1
)

REM Run the application
echo Starting Polymarket Market Maker...
python main.py

echo Application stopped.
pause