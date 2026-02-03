Write-Host "Installing Python 3.11..."
winget install -e --id Python.Python.3.11 --source winget

Write-Host "----------------------------------------------------------------"
Write-Host "Installation command sent."
Write-Host "IMPORTANT: You may see a User Account Control (UAC) prompt. Please click 'Yes'."
Write-Host "AFTER installation completes:"
Write-Host "1. Close THIS terminal."
Write-Host "2. Open a NEW terminal."
Write-Host "3. Run 'python --version' to verify."
Write-Host "4. Then try running the RAG setup script again."
Write-Host "----------------------------------------------------------------"


