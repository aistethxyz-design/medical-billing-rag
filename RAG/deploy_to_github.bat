@echo off
echo 🚀 Preparing files for GitHub deployment...

echo 📁 Creating .streamlit directory...
mkdir .streamlit 2>nul

echo 📝 Copying files...
copy simple_app.py app.py
copy requirements_github.txt requirements.txt
copy .streamlit\config.toml .streamlit\

echo 📦 Creating .gitignore...
echo __pycache__/ > .gitignore
echo *.pyc >> .gitignore
echo .env >> .gitignore
echo .streamlit/secrets.toml >> .gitignore

echo ✅ Files prepared for GitHub!
echo.
echo 📋 Next steps:
echo 1. Go to https://github.com/new
echo 2. Create a new repository named "medical-billing-rag"
echo 3. Make it PUBLIC (required for free GitHub Pages)
echo 4. Upload these files to your repository:
echo    - app.py
echo    - Codes by class.csv
echo    - requirements.txt
echo    - README.md
echo    - .streamlit/config.toml
echo    - .github/workflows/deploy.yml
echo.
echo 5. Go to repository Settings > Pages
echo 6. Select "Deploy from a branch" > "main" > "/ (root)"
echo 7. Click Save
echo.
echo 🌐 Your app will be available at:
echo https://aistethxyz-design.github.io/medical-billing-rag/
echo.
echo 🔐 Login: aistethxyz@gmail.com / bestaisteth

pause
