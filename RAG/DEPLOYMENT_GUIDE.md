# 🚀 Hetzner Server Deployment Guide

## Prerequisites
- Hetzner server running at `5.161.47.228`
- SSH access to the server
- Your local machine with the application files

## Step 1: Test SSH Connection
First, test if you can connect to your server:
```bash
ssh root@5.161.47.228
```

If this works, you'll see a server prompt. If not, you may need to:
1. Check if you have SSH keys set up
2. Use password authentication
3. Check if the server is running

## Step 2: Manual File Upload
Once connected to your server, run these commands:

### On the Server:
```bash
# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y python3 python3-pip nginx

# Create application directory
mkdir -p /opt/medical-billing-rag
cd /opt/medical-billing-rag
```

### On Your Local Machine (in a new terminal):
```bash
# Upload files one by one
scp simple_app.py root@5.161.47.228:/opt/medical-billing-rag/app.py
scp "Codes by class.csv" root@5.161.47.228:/opt/medical-billing-rag/
scp deploy_simple.sh root@5.161.47.228:/opt/medical-billing-rag/
```

## Step 3: Deploy on Server
Back on your server terminal:
```bash
cd /opt/medical-billing-rag
chmod +x deploy_simple.sh
./deploy_simple.sh
```

## Step 4: Access Your Website
Once deployment is complete:
- **URL:** http://5.161.47.228
- **Login:** `aistethxyz@gmail.com` / `bestaisteth`

## Troubleshooting

### If SSH doesn't work:
1. Check if the server is running
2. Try password authentication: `ssh -o PreferredAuthentications=password root@5.161.47.228`
3. Check if you have the correct IP address

### If files don't upload:
1. Make sure you're in the correct directory
2. Check if the server has enough space
3. Verify file permissions

### If the app doesn't start:
1. Check logs: `journalctl -u medical-billing-rag.service -f`
2. Restart service: `systemctl restart medical-billing-rag.service`
3. Check if port 80 is open: `ufw status`

## Quick Commands
```bash
# Check service status
systemctl status medical-billing-rag.service

# View logs
journalctl -u medical-billing-rag.service -f

# Restart service
systemctl restart medical-billing-rag.service

# Check if app is running
curl http://localhost:8501
```
