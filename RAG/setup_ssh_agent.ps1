# Run this script as Administrator
# Right-click PowerShell -> Run as Administrator
# Then execute: .\setup_ssh_agent.ps1

Write-Host "Setting up SSH Agent..." -ForegroundColor Cyan

# Set SSH agent to start automatically
Get-Service ssh-agent | Set-Service -StartupType Automatic
Write-Host "SSH agent set to start automatically" -ForegroundColor Green

# Start the SSH agent service
Start-Service ssh-agent
Write-Host "SSH agent started" -ForegroundColor Green

# Add the SSH key
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
Write-Host "SSH key added to agent" -ForegroundColor Green

Write-Host ""
Write-Host "SSH agent setup complete!" -ForegroundColor Green
Write-Host "You can now connect to your server with:" -ForegroundColor Yellow
Write-Host "ssh kwasi@5.161.47.228" -ForegroundColor White