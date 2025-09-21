@echo off
echo Starting AISteth Frontend...

cd frontend

echo Starting frontend development server...
echo.
echo Frontend will be available at: http://localhost:5173
echo Billing Assistant: http://localhost:5173/billing
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
