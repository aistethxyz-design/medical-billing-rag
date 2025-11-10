@echo off
echo ========================================
echo Starting AISTETH Landing Page Server
echo ========================================
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Installing dependencies if needed...
call npm install
echo.
echo Starting development server...
echo Server will run on: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.
call npm run dev
pause


