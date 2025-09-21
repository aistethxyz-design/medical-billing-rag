@echo off
echo 🚀 Uploading Simple Medical Billing RAG to Hetzner Cloud Server...

echo 📁 Uploading application files...
scp simple_app.py root@5.161.47.228:/opt/medical-billing-rag/app.py
scp "Codes by class.csv" root@5.161.47.228:/opt/medical-billing-rag/
scp deploy_simple.sh root@5.161.47.228:/opt/medical-billing-rag/

echo 🔧 Running deployment script on server...
ssh root@5.161.47.228 "cd /opt/medical-billing-rag && chmod +x deploy_simple.sh && ./deploy_simple.sh"

echo ✅ Deployment completed!
echo 🌐 Your application is now available at: http://5.161.47.228
echo 🔐 Login with: aistethxyz@gmail.com / bestaisteth

pause

