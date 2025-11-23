# 🚀 AISteth Coolify Deployment - Quick Reference

## 🔑 Server Access

```bash
# SSH into server
ssh kwasi@5.161.47.228
# Password: Contract0r%

# Access Coolify via SSH tunnel
ssh -L 8000:localhost:8000 kwasi@5.161.47.228
# Then open: http://localhost:8000
```

## 🌐 URLs

- **Production Site:** https://aisteth.xyz
- **Coolify Dashboard:** https://coolify.aisteth.xyz
- **API Health Check:** https://aisteth.xyz/api/health
- **Server IP:** 5.161.47.228

## 📝 Database Credentials

```
Host: localhost
Database: n8n
User: 2raeZJwtbEkRNuO5
Password: lX1VM4k2Owd2bLp4TbQGcBWW86zLbcZ0
```

## 🚢 Deployment Process

### 1. Fix Build Issues (Already Done!)
```bash
cd frontend
npm install  # Installs updated compatible versions
npm run build  # Test locally
```

### 2. Commit & Push
```bash
git add .
git commit -m "Fix TypeScript build and add deployment config"
git push origin main
```

### 3. Deploy in Coolify
1. Access dashboard: https://coolify.aisteth.xyz
2. Find your service
3. Click **"Deploy"** or **"Redeploy"**
4. Monitor build logs
5. Wait for "Deployment successful"

## 🔧 Environment Variables to Set in Coolify

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://2raeZJwtbEkRNuO5:lX1VM4k2Owd2bLp4TbQGcBWW86zLbcZ0@localhost:5432/n8n
JWT_SECRET=your-secret-jwt-key-64-chars
OPENAI_API_KEY=sk-your-openai-api-key
FRONTEND_URL=https://aisteth.xyz
CORS_ORIGIN=https://aisteth.xyz
```

## 🐛 Common Issues & Fixes

### TypeScript Build Errors
**Problem:** JSX component type mismatch  
**Fix:** Updated package.json with compatible versions (already done)

### Module Not Found
**Problem:** Missing dependencies  
**Fix:** Force rebuild in Coolify with cache clear

### Database Connection Error
**Problem:** Can't connect to PostgreSQL  
**Fix:** Verify DATABASE_URL environment variable

### Port Already in Use
**Problem:** Port 3001 taken  
**Fix:** Check and stop conflicting services in Coolify

## 📦 What Changed

### frontend/package.json
- React: 18.2.0 → 18.3.1
- React DOM: 18.2.0 → 18.3.1
- React Router DOM: 6.20.1 → 6.26.0
- @types/react: 18.3.24 → 18.3.12
- @types/react-dom: 18.3.7 → 18.3.1

### New Files
- `/Dockerfile` - Multi-stage production build
- `/.dockerignore` - Excludes unnecessary files
- `/COOLIFY_DEPLOYMENT.md` - Full deployment guide
- `/deploy-to-coolify.sh` - Automated deployment helper

## ✅ Post-Deployment Checklist

- [ ] Frontend loads at https://aisteth.xyz
- [ ] API responds at https://aisteth.xyz/api/health
- [ ] SSL certificate is active (HTTPS working)
- [ ] Login works with demo credentials
- [ ] File upload functionality works
- [ ] Database connection is stable
- [ ] Health check passes

## 🔍 Verify Deployment

```bash
# Test API health
curl https://aisteth.xyz/api/health

# Test login endpoint
curl -X POST https://aisteth.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@aisteth.com","password":"demo123"}'
```

## 📊 Monitoring

### View Logs in Coolify
Dashboard → Your Service → Logs

### View Logs via SSH
```bash
ssh kwasi@5.161.47.228
docker logs <container-name> -f --tail 100
```

## 🔄 Update Process

```bash
# 1. Make changes locally
# 2. Test build
npm run build

# 3. Commit and push
git add .
git commit -m "Your update message"
git push origin main

# 4. Redeploy in Coolify dashboard
```

## 🆘 Emergency Rollback

In Coolify:
1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Rollback to this version"

## 📞 Need Help?

- **Coolify Docs:** https://coolify.io/docs
- **Hetzner Console:** https://console.hetzner.cloud
- **GitHub Repo:** https://github.com/aistethxyz-design/medical-billing-rag

---

*Quick Reference | Last Updated: Oct 11, 2025*



