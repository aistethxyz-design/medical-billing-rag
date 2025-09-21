@echo off
echo 🚀 AISteth Setup Script
echo ================================
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell is available'" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell is not available. Please install PowerShell.
    pause
    exit /b 1
)

REM Run the PowerShell setup script
echo 📋 Running AISteth setup...
powershell -ExecutionPolicy Bypass -File "setup.ps1"

REM Check if setup was successful
if %errorlevel% neq 0 (
    echo.
    echo ❌ Setup failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo 🎉 Setup completed! You can now run 'npm run dev' to start the application.
pause 