# 📁 Upload Guide for Hetzner Server

## Method 1: Using Hetzner Console (Recommended)

### Step 1: Access Your Server
1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Click on your server (5.161.47.228)
3. Click "Console" to access the web terminal

### Step 2: Upload Files
1. In the Hetzner console, click "Upload" or "File Manager"
2. Upload the following files to `/opt/`:
   - `medical-billing-rag.zip`
   - `simple_app.py` (rename to `app.py`)
   - `Codes by class.csv`

### Step 3: Deploy
Run these commands in the Hetzner console:

```bash
# Navigate to the directory
cd /opt

# Extract the zip file
unzip medical-billing-rag.zip

# Make the script executable
chmod +x hetzner_deploy.sh

# Run the deployment script
./hetzner_deploy.sh
```

## Method 2: Using SCP (If SSH works)

### Step 1: Upload Files
```bash
# Upload the zip file
scp medical-billing-rag.zip root@5.161.47.228:/opt/

# Or upload individual files
scp simple_app.py root@5.161.47.228:/opt/app.py
scp "Codes by class.csv" root@5.161.47.228:/opt/
scp hetzner_deploy.sh root@5.161.47.228:/opt/
```

### Step 2: Deploy
```bash
# SSH into your server
ssh root@5.161.47.228

# Navigate and extract
cd /opt
unzip medical-billing-rag.zip
chmod +x hetzner_deploy.sh
./hetzner_deploy.sh
```

## Method 3: Manual File Creation

If you can't upload files, you can create them directly on the server:

### Step 1: Create the app.py file
```bash
cd /opt
nano app.py
# Then paste the content from simple_app.py
```

### Step 2: Create the CSV file
```bash
nano "Codes by class.csv"
# Then paste the content from your CSV file
```

### Step 3: Run deployment commands
```bash
# Install packages
apt update && apt upgrade -y
apt install -y python3 python3-pip nginx
pip3 install streamlit pandas

# Create systemd service
cat > /etc/systemd/system/medical-billing-rag.service << 'EOF'
[Unit]
Description=Medical Billing RAG Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/python3 -m streamlit run app.py --server.port 8501 --server.address 0.0.0.0 --server.headless true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
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
ln -sf /etc/nginx/sites-available/medical-billing-rag /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Start services
nginx -t && systemctl reload nginx
systemctl daemon-reload
systemctl enable medical-billing-rag.service
systemctl start medical-billing-rag.service

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Check status
systemctl status medical-billing-rag.service
```

## ✅ After Deployment

Your app will be available at:
- **URL:** http://5.161.47.228
- **Login:** `aistethxyz@gmail.com` / `bestaisteth`

## 🔧 Troubleshooting

If the app doesn't start:
```bash
# Check logs
journalctl -u medical-billing-rag.service -f

# Restart service
systemctl restart medical-billing-rag.service

# Check if port is open
netstat -tlnp | grep :8501
```
