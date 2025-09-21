# 🚀 GitHub Pages Deployment Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Repository name: `medical-billing-rag`
5. Description: `Medical Billing RAG Assistant - AI-powered billing code optimization`
6. Make it **Public** (required for free GitHub Pages)
7. Don't initialize with README (we'll add our files)
8. Click "Create repository"

## Step 2: Prepare Files for GitHub

### Files to upload:
- `simple_app.py` (rename to `app.py`)
- `Codes by class.csv`
- `requirements.txt`
- `README.md`
- `.streamlit/config.toml`

## Step 3: Upload Files

### Option A: Using GitHub Web Interface
1. Go to your new repository
2. Click "uploading an existing file"
3. Drag and drop all the files
4. Add commit message: "Initial commit - Medical Billing RAG app"
5. Click "Commit changes"

### Option B: Using Git Commands
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit - Medical Billing RAG app"

# Add remote origin (replace with your username)
git remote add origin https://github.com/aistethxyz-design/medical-billing-rag.git
git branch -M main
git push -u origin main
```

## Step 4: Enable GitHub Pages

1. Go to your repository settings
2. Scroll down to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Select "main" branch
5. Select "/ (root)" folder
6. Click "Save"

## Step 5: Access Your App

Your app will be available at:
- **URL:** `https://aistethxyz-design.github.io/medical-billing-rag/`
- **Login:** `aistethxyz@gmail.com` / `bestaisteth`

## Step 6: Update Streamlit Config

We need to update the Streamlit config for GitHub Pages hosting.

## Troubleshooting

### If the app doesn't load:
1. Check the Actions tab for build errors
2. Ensure all files are in the root directory
3. Check that requirements.txt has all dependencies

### If you need to update the app:
1. Make changes to your files
2. Commit and push to GitHub
3. GitHub Pages will automatically rebuild
