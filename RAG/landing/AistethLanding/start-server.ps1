Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting AISTETH Landing Page Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Set-Location $PSScriptRoot
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Installing dependencies if needed..." -ForegroundColor Yellow
npm install
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Server will run on: http://localhost:5000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
npm run dev


