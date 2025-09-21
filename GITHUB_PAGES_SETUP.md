# GitHub Pages Hosting Setup

## 🌐 Live Website
- **Main Site:** https://aistethxyz-design.github.io/medical-billing-rag/
- **Chatbot Interface:** https://aistethxyz-design.github.io/medical-billing-rag/chatbot/

## 🚀 Quick Deploy

Run the deployment script:
```bash
python quick_deploy_pages.py
```

## 📋 Manual Setup Steps

1. **Enable GitHub Pages:**
   - Go to: https://github.com/aistethxyz-design/medical-billing-rag/settings/pages
   - Under "Source", select "GitHub Actions"
   - Click "Save"

2. **Monitor Deployment:**
   - Check: https://github.com/aistethxyz-design/medical-billing-rag/actions
   - Wait for "Deploy to GitHub Pages" workflow to complete (3-5 minutes)

3. **Access Your Website:**
   - Main landing page with app overview
   - Working chatbot interface
   - Links to source code

## 🔐 Demo Credentials
- **Email:** demo@aisteth.com
- **Password:** demo123

## 🛠️ What Gets Deployed

### Frontend Components:
- **Landing Page** - Main entry point with feature overview
- **Chatbot Interface** - Standalone chat application
- **Static Assets** - All necessary CSS, JS, and image files

### Features Available Online:
- ✅ Interactive chatbot interface
- ✅ Responsive design for mobile/desktop
- ✅ Professional landing page
- ✅ Link to GitHub repository
- ⚠️ Backend features require server (for full functionality)

## 🔧 Technical Details

- **Build Process:** GitHub Actions automatically builds React apps
- **Deployment:** Automated via GitHub Pages
- **Base URL:** Configured for GitHub Pages subdirectory
- **Updates:** Automatic on push to `clean-master` or `main` branch
