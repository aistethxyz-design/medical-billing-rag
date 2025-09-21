@echo off
echo ========================================
echo AISteth Setup Script
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 20 LTS from https://nodejs.org
    pause
    exit /b 1
)
echo Node.js found - OK

echo Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please install Node.js with npm
    pause
    exit /b 1
)
echo npm found - OK

echo.
echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo Root dependencies installed - OK

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Installing additional frontend dependencies...
call npm install @tailwindcss/typography @tailwindcss/forms @tanstack/react-query @vitejs/plugin-react-swc
if %errorlevel% neq 0 (
    echo ERROR: Failed to install additional frontend dependencies
    pause
    exit /b 1
)
echo Frontend dependencies installed - OK

echo.
echo Installing backend dependencies...
cd ..\backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed - OK

echo.
echo Setting up Prisma with WASM engine...
set PRISMA_CLIENT_ENGINE_TYPE=wasm
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo Prisma client generated - OK

echo.
echo Setting up database...
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 (
    echo ERROR: Failed to push database schema
    pause
    exit /b 1
)
echo Database schema pushed - OK

cd ..

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the application, run:
echo   npm run dev
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:3001
echo.
echo Demo login credentials:
echo   Email: demo@aisteth.com
echo   Password: demo123
echo.
pause 