# AISteth Setup Script for Windows
# This script automates the complete setup process for AISteth

Write-Host "🚀 AISteth Setup Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if Node.js is installed
Write-Host "📋 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $nodeArch = node -p "process.arch"
    Write-Host "✅ Node.js $nodeVersion ($nodeArch) detected" -ForegroundColor Green
    
    if ($nodeArch -eq "arm64") {
        Write-Host "⚠️  Warning: You're running Windows ARM64 Node.js" -ForegroundColor Yellow
        Write-Host "   This will use Prisma WASM engine (slower but compatible)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 20 LTS from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if npm is available
Write-Host "📋 Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install Node.js with npm" -ForegroundColor Red
    exit 1
}

# Clean previous installations (optional)
$cleanChoice = Read-Host "🧹 Do you want to clean previous installations? (y/N)"
if ($cleanChoice -eq "y" -or $cleanChoice -eq "Y") {
    Write-Host "🧹 Cleaning previous installations..." -ForegroundColor Yellow
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path "frontend/node_modules") { Remove-Item -Recurse -Force "frontend/node_modules" }
    if (Test-Path "backend/node_modules") { Remove-Item -Recurse -Force "backend/node_modules" }
    if (Test-Path "backend/node_modules/.prisma") { Remove-Item -Recurse -Force "backend/node_modules/.prisma" }
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Root dependencies installed" -ForegroundColor Green

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

# Install specific frontend dependencies that might be missing
Write-Host "📦 Installing additional frontend dependencies..." -ForegroundColor Yellow
npm install @tailwindcss/typography @tailwindcss/forms @tanstack/react-query @vitejs/plugin-react-swc
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install additional frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
cd ../backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Setup Prisma with WASM engine
Write-Host "🗄️  Setting up Prisma with WASM engine..." -ForegroundColor Yellow
$env:PRISMA_CLIENT_ENGINE_TYPE = "wasm"
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated with WASM engine" -ForegroundColor Green

# Push database schema
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push database schema" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database schema pushed" -ForegroundColor Green

# Return to root directory
cd ..

Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the application, run:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📱 Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend will be available at: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Demo login credentials:" -ForegroundColor Cyan
Write-Host "   Email: demo@aisteth.com" -ForegroundColor White
Write-Host "   Password: demo123" -ForegroundColor White
Write-Host ""
Write-Host "📚 Available commands:" -ForegroundColor Cyan
Write-Host "   npm run dev          - Start development servers" -ForegroundColor White
Write-Host "   npm run build        - Build for production" -ForegroundColor White
Write-Host "   npm run db:studio    - Open Prisma Studio" -ForegroundColor White
Write-Host "   npm run reset        - Clean and reinstall everything" -ForegroundColor White 