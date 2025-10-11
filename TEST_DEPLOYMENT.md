# 🧪 Test Deployment Guide

This is a **minimal test server** to verify your Coolify deployment is working correctly.

## What This Is

- ✅ Ultra-simple Node.js HTTP server
- ✅ No dependencies (uses only Node.js built-in modules)
- ✅ No TypeScript compilation
- ✅ No AI/OpenAI requirements
- ✅ No database
- ✅ Just works! 🎉

## Files

- `test-server.js` - Simple Node.js HTTP server
- `Dockerfile.test` - Minimal Dockerfile for testing

## How to Use in Coolify

### Option 1: Quick Test (Recommended First)

1. **In Coolify, go to your application settings**
2. **Change the Dockerfile path:**
   - Find "Dockerfile Location" setting
   - Change from `Dockerfile` to `Dockerfile.test`
3. **Save and Deploy**
4. **Visit your URL** - You'll see a nice welcome page!

### Option 2: Test Locally First

```bash
# Test locally
node test-server.js

# Visit http://localhost:3001
# Should see: "✅ Server is Running Successfully!"
```

## Endpoints

Once deployed, you'll have:

- **`/`** - Welcome page with server info (HTML)
- **`/health`** - Health check endpoint (JSON)
- **`/test`** - Simple test endpoint (JSON)

## What Success Looks Like

### In Browser (`http://your-domain.aisteth.xyz/`)
```
🏥 AISteth Test Server
✅ Server is Running Successfully!

Server Information:
- Port: 3001
- Node.js: v20.x.x
- Environment: production
- Timestamp: 2025-10-11T...
```

### Health Check (`/health`)
```json
{
  "status": "healthy",
  "message": "✅ Server is running!",
  "timestamp": "2025-10-11T21:50:00.000Z",
  "port": 3001,
  "node_version": "v20.x.x",
  "environment": "production"
}
```

## Deployment Checklist

- [ ] Server starts successfully
- [ ] Health check passes in Coolify
- [ ] Can access `/` endpoint in browser
- [ ] Can access `/health` endpoint
- [ ] No crashes in container logs

## After Test Succeeds

Once this test deployment works:

1. ✅ **You know Coolify is working correctly**
2. ✅ **Docker builds are successful**
3. ✅ **Health checks are configured properly**
4. ✅ **Network/routing is correct**

Then you can:

- Switch back to main `Dockerfile` for full application
- Add environment variables (OPENAI_API_KEY, etc.)
- Deploy the complete medical billing platform

## Troubleshooting

### Container Still Unhealthy?

Check Coolify logs for:
```
🚀 AISteth Test Server Started Successfully!
📍 Port: 3001
```

If you see this, the server is running! Health check should pass.

### Can't Access in Browser?

- Check Coolify domain settings
- Verify port 3001 is exposed
- Check container is actually running

## Switching Back to Full App

When ready to deploy the full application:

1. **In Coolify settings:**
   - Change Dockerfile path back to `Dockerfile`
2. **Add environment variables:**
   ```
   OPENAI_API_KEY=your-key-here
   NODE_ENV=production
   PORT=3001
   ```
3. **Deploy again**

---

**This test server has ZERO dependencies and WILL work if Coolify is set up correctly!** 🚀

