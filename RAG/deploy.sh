#!/bin/bash

# Medical Billing RAG - Deployment Script for Hetzner Cloud
# Run this script on your Hetzner server

set -e

echo "🚀 Starting Medical Billing RAG Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install additional tools
echo "🔧 Installing additional tools..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/medical-billing-rag
sudo chown $USER:$USER /opt/medical-billing-rag
cd /opt/medical-billing-rag

# Clone or copy application files
echo "📋 Setting up application files..."
# If you have the files in a git repository:
# git clone <your-repo-url> .

# Or copy files from your local machine:
# scp -r /path/to/your/medical-billing-rag/* root@5.161.47.228:/opt/medical-billing-rag/

# Create necessary directories
mkdir -p data logs ssl

# Set up environment variables
echo "🔐 Setting up environment variables..."
cp env.production .env
nano .env  # Edit with your actual API keys

# Set up SSL certificates
echo "🔒 Setting up SSL certificates..."
sudo certbot --nginx -d 5.161.47.228 --non-interactive --agree-tos --email aistethxyz@gmail.com

# Build and start the application
echo "🏗️ Building and starting the application..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Set up log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/medical-billing-rag << EOF
/opt/medical-billing-rag/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

# Set up systemd service for auto-start
echo "⚙️ Setting up systemd service..."
sudo tee /etc/systemd/system/medical-billing-rag.service << EOF
[Unit]
Description=Medical Billing RAG Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/medical-billing-rag
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable medical-billing-rag.service

# Set up monitoring
echo "📊 Setting up monitoring..."
sudo tee /etc/cron.d/medical-billing-rag-monitor << EOF
# Health check every 5 minutes
*/5 * * * * root curl -f http://localhost:8501/_stcore/health || systemctl restart medical-billing-rag
EOF

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Final status check
echo "✅ Deployment completed! Checking status..."
sleep 10
docker-compose ps
curl -f http://localhost:8501/_stcore/health && echo "✅ Application is healthy!"

echo "🎉 Medical Billing RAG is now running on https://5.161.47.228"
echo "📊 Admin Panel: https://5.161.47.228 (login with aistethxyz@gmail.com / bestaisteth)"
echo "📝 Logs: docker-compose logs -f"
echo "🔄 Restart: docker-compose restart"
echo "🛑 Stop: docker-compose down"

