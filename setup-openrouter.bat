@echo off
echo Setting up AISteth with OpenRouter API...

echo.
echo 1. Creating environment file...
if not exist backend\.env (
    echo # Database > backend\.env
    echo DATABASE_URL="file:./prisma/dev.db" >> backend\.env
    echo. >> backend\.env
    echo # JWT Secret >> backend\.env
    echo JWT_SECRET="aisteth-super-secret-jwt-key-2024" >> backend\.env
    echo. >> backend\.env
    echo # OpenAI Configuration (using OpenRouter) >> backend\.env
    echo OPENAI_API_KEY="your-openrouter-api-key-here" >> backend\.env
    echo OPENAI_BASE_URL="https://openrouter.ai/api/v1" >> backend\.env
    echo OPENAI_MODEL="anthropic/claude-3.5-sonnet" >> backend\.env
    echo. >> backend\.env
    echo # Redis Configuration >> backend\.env
    echo REDIS_URL="redis://localhost:6379" >> backend\.env
    echo. >> backend\.env
    echo # CORS Configuration >> backend\.env
    echo CORS_ORIGIN="http://localhost:3000,http://localhost:5173" >> backend\.env
    echo. >> backend\.env
    echo # Rate Limiting >> backend\.env
    echo RATE_LIMIT_MAX_REQUESTS=100 >> backend\.env
    echo RATE_LIMIT_WINDOW_MS=900000 >> backend\.env
    echo. >> backend\.env
    echo # Server Configuration >> backend\.env
    echo PORT=3001 >> backend\.env
    echo NODE_ENV=development >> backend\.env
    echo. >> backend\.env
    echo # Logging >> backend\.env
    echo LOG_LEVEL="info" >> backend\.env
    echo LOG_DIR="./logs" >> backend\.env
    echo Environment file created!
) else (
    echo Environment file already exists.
)

echo.
echo 2. Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies!
    pause
    exit /b 1
)

echo.
echo 3. Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies!
    pause
    exit /b 1
)

echo.
echo 4. Setting up database...
cd ..\backend
call npx prisma generate
if %errorlevel% neq 0 (
    echo Error generating Prisma client!
    pause
    exit /b 1
)

echo.
echo 5. Setup complete!
echo.
echo IMPORTANT: Please update backend\.env with your OpenRouter API key:
echo 1. Get your API key from https://openrouter.ai/
echo 2. Replace "your-openrouter-api-key-here" in backend\.env with your actual key
echo 3. Save the file
echo.
echo To start the application:
echo 1. Run: start-backend.bat
echo 2. Run: start-frontend.bat (in a new terminal)
echo.
pause
