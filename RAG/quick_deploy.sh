#!/bin/bash

# Quick Deployment Script for Hetzner Server
echo "🚀 Starting Quick Deployment..."

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install packages
echo "🔧 Installing packages..."
apt install -y python3 python3-pip nginx

# Create directory
echo "📁 Creating directory..."
mkdir -p /opt/medical-billing-rag
cd /opt/medical-billing-rag

# Install Python packages
echo "📦 Installing Python packages..."
pip3 install streamlit pandas

# Create systemd service
echo "⚙️ Creating service..."
cat > /etc/systemd/system/medical-billing-rag.service << 'EOF'
[Unit]
Description=Medical Billing RAG Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/medical-billing-rag
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/python3 -m streamlit run app.py --server.port 8501 --server.address 0.0.0.0 --server.headless true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/medical-billing-rag << 'EOF'
server {
    listen 80;
    server_name 5.161.47.228;

    location / {
        proxy_pass http://127.0.0.1:8501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
echo "🔗 Enabling site..."
ln -sf /etc/nginx/sites-available/medical-billing-rag /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Start services
echo "🚀 Starting services..."
nginx -t && systemctl reload nginx
systemctl daemon-reload
systemctl enable medical-billing-rag.service
systemctl start medical-billing-rag.service

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Check status
echo "✅ Checking status..."
sleep 3
systemctl status medical-billing-rag.service --no-pager

echo ""
echo "🎉 Deployment completed!"
echo "🌐 Your app is available at: http://5.161.47.228"
echo "🔐 Login: aistethxyz@gmail.com / bestaisteth"
echo ""
echo "📝 To check logs: journalctl -u medical-billing-rag.service -f"
echo "🔄 To restart: systemctl restart medical-billing-rag.service"
