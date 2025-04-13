@echo off
echo Starting RoboInsights VEX Brain Connection Utility...
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Create dist directory if it doesn't exist
if not exist "dist" (
    mkdir dist
)

REM Run the application using npm script with proper ts-node execution
call npm start

REM Keep terminal open on error
if %errorlevel% neq 0 (
    echo.
    echo An error occurred while running the application.
    pause
)