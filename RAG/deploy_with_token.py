#!/usr/bin/env python3
"""
Deploy to GitHub using Personal Access Token
"""

import subprocess
import sys
import os

def run_command(cmd):
    """Run a command and return the result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    print("🚀 Deploying to GitHub with Personal Access Token...")
    
    # Your GitHub token (use environment variable for security)
    token = os.getenv('GITHUB_TOKEN', 'your_github_token_here')
    
    # Set up the remote URL with token
    repo_url = f"https://aistethxyz@gmail.com:{token}@github.com/aistethxyz-design/medical-billing-rag.git"
    
    print("🔧 Setting up remote URL...")
    success, stdout, stderr = run_command(f"git remote set-url origin {repo_url}")
    
    if not success:
        print(f"❌ Failed to set remote URL: {stderr}")
        return
    
    print("✅ Remote URL updated")
    
    # Add all changes
    print("📁 Adding changes...")
    success, stdout, stderr = run_command("git add .")
    
    if not success:
        print(f"❌ Failed to add changes: {stderr}")
        return
    
    print("✅ Changes added")
    
    # Commit changes
    print("💾 Committing changes...")
    success, stdout, stderr = run_command('git commit -m "Fix file structure and add missing files for GitHub Pages"')
    
    if not success:
        print(f"❌ Failed to commit: {stderr}")
        return
    
    print("✅ Changes committed")
    
    # Push to GitHub
    print("🚀 Pushing to GitHub...")
    success, stdout, stderr = run_command("git push origin main")
    
    if success:
        print("🎉 Successfully pushed to GitHub!")
        print("🌐 Your app should be live at: https://aistethxyz-design.github.io/medical-billing-rag/")
        print("🔐 Login with: aistethxyz@gmail.com / bestaisteth")
        
        # Check if GitHub Actions is running
        print("\n📋 Next steps:")
        print("1. Go to: https://github.com/aistethxyz-design/medical-billing-rag/actions")
        print("2. Check if the deployment workflow is running")
        print("3. Wait for it to complete (usually 2-3 minutes)")
        print("4. Visit your app: https://aistethxyz-design.github.io/medical-billing-rag/")
        
    else:
        print(f"❌ Push failed: {stderr}")
        print("\n💡 The token might have expired or have insufficient permissions")
        print("   Make sure the token has 'repo' scope enabled")

if __name__ == "__main__":
    main()
