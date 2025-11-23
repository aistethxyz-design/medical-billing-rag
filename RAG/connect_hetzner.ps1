# Simple script to connect to Hetzner server without SSH agent
# This works without administrator privileges

Write-Host "Connecting to Hetzner server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Your public key (copy this to add to the server):" -ForegroundColor Yellow
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
Write-Host ""
Write-Host "Attempting to connect with SSH key..." -ForegroundColor Cyan

# Connect using the SSH key directly (no agent needed)
ssh -i "$env:USERPROFILE\.ssh\id_ed25519" root@5.161.47.228

