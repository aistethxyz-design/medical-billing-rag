@echo off
echo ========================================
echo Starting AISteth RAG Agent
echo ========================================
echo.

echo [1/2] Starting Backend Server (Port 3002)...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:3002
echo RAG Agent: http://localhost:3000/billing
echo.
echo Press any key to exit (servers will continue running)...
pause >nul

