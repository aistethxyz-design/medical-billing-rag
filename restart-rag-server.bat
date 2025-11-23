@echo off
echo ========================================
echo Restarting RAG Server with GPT-4o
echo ========================================
echo.
echo Stopping any existing server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *simple-rag-server*" 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting server...
cd backend
node simple-rag-server.js
pause

