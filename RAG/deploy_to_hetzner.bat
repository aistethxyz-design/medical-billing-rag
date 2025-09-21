@echo off
echo 🚀 Deploying Medical Billing RAG to Hetzner Server...

echo 📁 Creating deployment package...
mkdir deploy_package 2>nul
copy simple_app.py deploy_package\app.py
copy "Codes by class.csv" deploy_package\
copy hetzner_deploy.sh deploy_package\

echo 📦 Creating zip package...
powershell Compress-Archive -Path deploy_package\* -DestinationPath medical-billing-rag.zip -Force

echo ✅ Deployment package created: medical-billing-rag.zip
echo.
echo 📋 Next steps:
echo 1. Go to your Hetzner Cloud Console
echo 2. Access your server via web console
echo 3. Upload medical-billing-rag.zip to /opt/
echo 4. Run: cd /opt && unzip medical-billing-rag.zip && chmod +x hetzner_deploy.sh && ./hetzner_deploy.sh
echo.
echo 🌐 Or use SSH with your key:
echo ssh root@5.161.47.228
echo Then upload the files manually

pause
