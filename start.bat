@echo off
echo 🚀 Starting AISteth...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 First time setup detected. Running setup...
    call setup.bat
    if %errorlevel% neq 0 (
        echo ❌ Setup failed. Please check the error messages.
        pause
        exit /b 1
    )
)

REM Start the application
echo 🎯 Starting development servers...
npm run dev

pause 