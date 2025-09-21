@echo off
echo ========================================
echo Starting AISteth Application
echo ========================================
echo.

echo Setting Prisma engine to WASM...
set PRISMA_CLIENT_ENGINE_TYPE=wasm

echo Starting development servers...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001
echo.
echo Press Ctrl+C to stop both servers
echo.

call npm run dev 