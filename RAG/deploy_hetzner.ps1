# PowerShell script to deploy to Hetzner server
Write-Host "🚀 Deploying Medical Billing RAG to Hetzner Cloud Server..." -ForegroundColor Green

# Accept SSH key automatically
Write-Host "📡 Connecting to server and accepting SSH key..." -ForegroundColor Yellow
$sshCommand = @"
ssh -o StrictHostKeyChecking=no root@5.161.47.228 "mkdir -p /opt/medical-billing-rag"
"@
Invoke-Expression $sshCommand

# Upload files
Write-Host "📁 Uploading application files..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no simple_app.py root@5.161.47.228:/opt/medical-billing-rag/app.py
scp -o StrictHostKeyChecking=no "Codes by class.csv" root@5.161.47.228:/opt/medical-billing-rag/
scp -o StrictHostKeyChecking=no deploy_simple.sh root@5.161.47.228:/opt/medical-billing-rag/

# Run deployment script
Write-Host "🔧 Running deployment script on server..." -ForegroundColor Yellow
$deployCommand = @"
ssh -o StrictHostKeyChecking=no root@5.161.47.228 "cd /opt/medical-billing-rag && chmod +x deploy_simple.sh && ./deploy_simple.sh"
"@
Invoke-Expression $deployCommand

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your application is now available at: http://5.161.47.228" -ForegroundColor Cyan
Write-Host "🔐 Login with: aistethxyz@gmail.com / bestaisteth" -ForegroundColor Cyan

Read-Host "Press Enter to continue"
