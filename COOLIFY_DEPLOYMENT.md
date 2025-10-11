# Coolify Deployment Guide for AISteth at aisteth.xyz

This guide walks you through deploying the AISteth medical billing platform to your Hetzner server using Coolify.

## Prerequisites

✅ Hetzner Cloud Server: `5.161.47.228`  
✅ Coolify Dashboard: `coolify.aisteth.xyz`  
✅ GitHub Repository: Connected and accessible  
✅ Domain: `aisteth.xyz` with DNS configured  

---

## 🚀 Quick Deploy Steps

### 1. Fix TypeScript Build Issues (Local)

First, update your dependencies to fix the React Router type conflicts:

```bash
# Navigate to frontend directory
cd frontend

# Install updated dependencies
npm install

# Test the build locally
npm run build
```

**What changed:**
- Updated React from `18.2.0` → `18.3.1`
- Updated React DOM from `18.2.0` → `18.3.1`
- Updated React Router DOM from `6.20.1` → `6.26.0`
- Downgraded @types/react from `18.3.24` → `18.3.12`
- Updated @types/react-dom from `18.3.7` → `18.3.1`

### 2. Commit and Push Changes

```bash
# From project root
cd ..

# Stage all changes
git add frontend/package.json Dockerfile .dockerignore COOLIFY_DEPLOYMENT.md

# Commit
git commit -m "Fix TypeScript build issues and add Coolify deployment config"

# Push to GitHub
git push origin main
```

### 3. Configure Coolify Deployment

#### Step 3.1: Access Coolify Dashboard

**Option A: SSH Tunnel (Recommended for first setup)**
```bash
ssh -L 8000:localhost:8000 kwasi@5.161.47.228
```
Then open: `http://localhost:8000`

**Option B: Direct Access**
Navigate to: `https://coolify.aisteth.xyz`

#### Step 3.2: Create New Project

1. Click **"New Project"**
2. Name: `AISteth Medical Platform`
3. Click **"Create"**

#### Step 3.3: Add Service

1. Click **"Add Service"**
2. Select **"Docker"** as deployment type
3. Source: **"GitHub"**
4. Repository: `aistethxyz-design/medical-billing-rag`
5. Branch: `main`
6. Dockerfile Path: `./Dockerfile`

#### Step 3.4: Configure Build Settings

**Build Configuration:**
- Build Method: `Docker`
- Dockerfile: `./Dockerfile`
- Context: `.` (root)
- Build Args: None needed

**Port Configuration:**
- Internal Port: `3001` (Backend API)
- External Port: `80` → `3001`
- Additional Port: `3000` (Frontend - static served by backend)

#### Step 3.5: Environment Variables

Add the following environment variables in Coolify:

```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3001
HOST=0.0.0.0

# Database (PostgreSQL from Coolify)
DATABASE_URL=postgresql://2raeZJwtbEkRNuO5:lX1VM4k2Owd2bLp4TbQGcBWW86zLbcZ0@localhost:5432/n8n

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# OpenAI API (for AI features)
OPENAI_API_KEY=your-openai-api-key-here

# Frontend URL
FRONTEND_URL=https://aisteth.xyz

# CORS Configuration
CORS_ORIGIN=https://aisteth.xyz

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/backend/uploads
```

#### Step 3.6: Volume Mounts

Add persistent volumes for data:

```
/app/backend/uploads -> /data/aisteth/uploads
/app/backend/logs -> /data/aisteth/logs
/app/backend/prisma/dev.db -> /data/aisteth/database/dev.db
```

#### Step 3.7: Health Check

Configure health check:
- Path: `/health`
- Port: `3001`
- Interval: `30s`
- Timeout: `10s`
- Retries: `3`

### 4. Deploy

1. Click **"Deploy"** button
2. Monitor the build logs
3. Wait for "Deployment successful" message

### 5. Configure Domain

#### In Coolify:
1. Go to your service settings
2. Click **"Domains"**
3. Add domain: `aisteth.xyz`
4. Enable **"Auto SSL"** (Let's Encrypt)
5. Click **"Save"**

#### In DNS Provider (DNSExit/Namecheap):
```
Type: A
Host: @
Value: 5.161.47.228
TTL: 3600
```

Wait 5-10 minutes for DNS propagation.

### 6. Verify Deployment

```bash
# Check if the API is responding
curl https://aisteth.xyz/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-11T..."}

# Access the frontend
open https://aisteth.xyz
```

---

## 🔧 Troubleshooting

### Build Fails with TypeScript Errors

**Problem:** JSX component type errors  
**Solution:**
```bash
cd frontend
npm install
npm run build  # Test locally first
```

### "Module not found" Errors

**Problem:** Missing dependencies  
**Solution:**
```bash
# Clear Docker cache in Coolify
# Redeploy with "Force Rebuild" option
```

### Database Connection Errors

**Problem:** Can't connect to PostgreSQL  
**Solution:**
1. Verify DATABASE_URL in environment variables
2. Check PostgreSQL service is running in Coolify
3. Ensure n8n database exists and user has permissions

### Port Conflicts

**Problem:** Port 3001 or 3000 already in use  
**Solution:**
1. Check other services in Coolify
2. Stop conflicting services
3. Or change PORT environment variable

### SSL Certificate Issues

**Problem:** HTTPS not working  
**Solution:**
1. Wait 5-10 minutes for Let's Encrypt provisioning
2. Check domain DNS is pointing to correct IP
3. Verify "Auto SSL" is enabled in Coolify

---

## 🎯 Post-Deployment Tasks

### 1. Test the Application

```bash
# Test backend API
curl https://aisteth.xyz/api/health

# Test authentication
curl -X POST https://aisteth.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@aisteth.com","password":"demo123"}'
```

### 2. Set Up Monitoring

In Coolify:
1. Enable **"Application Logs"**
2. Set up **"Metrics Collection"**
3. Configure **"Alerts"** for downtime

### 3. Configure Backups

```bash
# SSH into server
ssh kwasi@5.161.47.228

# Create backup script
sudo nano /home/kwasi/backup-aisteth.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/home/kwasi/backups/aisteth"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec <container-name> pg_dump -U 2raeZJwtbEkRNuO5 n8n > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /data/aisteth/uploads

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

Make executable:
```bash
chmod +x /home/kwasi/backup-aisteth.sh
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /home/kwasi/backup-aisteth.sh
```

### 4. Performance Optimization

In Coolify service settings:
- **CPU Limit:** 2 cores
- **Memory Limit:** 2GB
- **Auto Restart:** Enabled
- **Max Restarts:** 3

---

## 🔐 Security Checklist

- [✓] Non-root user in Docker container
- [✓] Environment variables configured (not hardcoded)
- [✓] HTTPS enabled with Let's Encrypt
- [✓] Database credentials secured
- [✓] JWT secret set to strong random value
- [✓] CORS restricted to aisteth.xyz
- [✓] File upload limits enforced
- [✓] Health checks configured
- [✓] SSH key authentication (no passwords)
- [✓] Firewall rules configured

---

## 📊 Monitoring & Logs

### View Logs in Coolify
1. Go to service dashboard
2. Click **"Logs"**
3. Select log type:
   - Build logs
   - Application logs
   - Error logs

### SSH Access to Check Logs
```bash
ssh kwasi@5.161.47.228

# View Docker logs
docker logs <container-name> -f --tail 100

# View application logs
tail -f /data/aisteth/logs/application.log
```

---

## 🔄 Update Deployment

To deploy new changes:

```bash
# 1. Make changes locally
# 2. Test locally
npm run build

# 3. Commit and push
git add .
git commit -m "Your changes"
git push origin main

# 4. In Coolify, click "Redeploy"
# Or set up auto-deploy on push
```

---

## 📞 Support & Resources

- **Coolify Docs:** https://coolify.io/docs
- **Hetzner Support:** https://console.hetzner.cloud
- **GitHub Repository:** https://github.com/aistethxyz-design/medical-billing-rag

---

## 🎉 Success!

Your AISteth Medical Platform is now live at:
- **Frontend:** https://aisteth.xyz
- **API:** https://aisteth.xyz/api
- **Demo Login:** demo@aisteth.com / demo123

**Next Steps:**
1. Set up custom email for notifications
2. Configure automated backups
3. Set up monitoring alerts
4. Train your team on the platform
5. Start processing medical documents!

---

*Last Updated: October 11, 2025*

