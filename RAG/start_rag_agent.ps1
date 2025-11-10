Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Medical Billing RAG Agent" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Set-Location $PSScriptRoot
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting Streamlit RAG Agent on port 8501..." -ForegroundColor Green
Write-Host ""
Write-Host "The RAG Agent will open in your browser automatically." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
streamlit run secure_billing_rag.py --server.port 8501

