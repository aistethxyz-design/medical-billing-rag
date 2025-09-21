@echo off
echo.
echo ========================================
echo   AISTETH GITHUB PAGES DEPLOYMENT
echo ========================================
echo.

echo 🚀 Deploying your AISteth website to GitHub Pages...
echo.

REM Set the GitHub token (replace with your actual token)
set GITHUB_TOKEN=YOUR_GITHUB_TOKEN_HERE

REM Configure git remote
echo 🔧 Configuring git remote...
git remote set-url origin https://aistethxyz-design:%GITHUB_TOKEN%@github.com/aistethxyz-design/medical-billing-rag.git

REM Add all changes
echo 📁 Adding changes...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "Deploy AISteth website to GitHub Pages"

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Your website has been deployed!
    echo.
    echo 📋 Next Steps:
    echo 1. Go to: https://github.com/aistethxyz-design/medical-billing-rag/settings/pages
    echo 2. Select "GitHub Actions" as the source
    echo 3. Wait for deployment to complete (3-5 minutes)
    echo.
    echo 🌟 Your website will be live at:
    echo https://aistethxyz-design.github.io/medical-billing-rag/
    echo.
    echo 🔐 Demo Login:
    echo Email: demo@aisteth.com
    echo Password: demo123
    echo.
) else (
    echo.
    echo ❌ Deployment failed. Please check the error messages above.
    echo.
)

pause
