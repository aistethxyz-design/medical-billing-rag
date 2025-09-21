@echo off
echo Starting AISteth Backend Server...

cd backend

echo Checking environment configuration...
if not exist .env (
    echo ERROR: .env file not found!
    echo Please run setup-openrouter.bat first
    pause
    exit /b 1
)

echo Starting backend server on port 3001...
echo.
echo Backend will be available at: http://localhost:3001
echo Billing Assistant API: http://localhost:3001/api/billing
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
