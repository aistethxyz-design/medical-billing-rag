#!/usr/bin/env python3
"""
Final GitHub Deployment Script
"""

import subprocess
import sys
import os
import time

def run_command(cmd, show_output=True):
    """Run a command and return the result"""
    try:
        if show_output:
            print(f"Running: {cmd}")
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if show_output and result.stdout:
            print(result.stdout)
        if show_output and result.stderr:
            print(result.stderr)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        if show_output:
            print(f"Error: {e}")
        return False, "", str(e)

def main():
    print("🚀 Final GitHub Deployment")
    print("=" * 50)
    
    # Your GitHub token (use environment variable for security)
    token = os.getenv('GITHUB_TOKEN', 'your_github_token_here')
    
    # Set up the remote URL with token
    repo_url = f"https://aistethxyz@gmail.com:{token}@github.com/aistethxyz-design/medical-billing-rag.git"
    
    print("🔧 Step 1: Setting up remote URL...")
    success, stdout, stderr = run_command(f"git remote set-url origin {repo_url}")
    
    if not success:
        print(f"❌ Failed to set remote URL: {stderr}")
        return
    
    print("✅ Remote URL updated")
    
    print("\n📁 Step 2: Adding all changes...")
    success, stdout, stderr = run_command("git add .")
    
    if not success:
        print(f"❌ Failed to add changes: {stderr}")
        return
    
    print("✅ All changes added")
    
    print("\n💾 Step 3: Committing changes...")
    success, stdout, stderr = run_command('git commit -m "Deploy Medical Billing RAG - Fix file structure and add GitHub Actions"')
    
    if not success:
        print(f"❌ Failed to commit: {stderr}")
        return
    
    print("✅ Changes committed")
    
    print("\n🚀 Step 4: Pushing to GitHub...")
    success, stdout, stderr = run_command("git push origin main")
    
    if success:
        print("\n🎉 SUCCESS! Deployed to GitHub!")
        print("=" * 50)
        print("🌐 Your app is now live at:")
        print("   https://aistethxyz-design.github.io/medical-billing-rag/")
        print("\n🔐 Login credentials:")
        print("   Username: aistethxyz@gmail.com")
        print("   Password: bestaisteth")
        print("\n📋 Next steps:")
        print("1. Wait 2-3 minutes for GitHub Actions to build")
        print("2. Check deployment status:")
        print("   https://github.com/aistethxyz-design/medical-billing-rag/actions")
        print("3. Visit your live app:")
        print("   https://aistethxyz-design.github.io/medical-billing-rag/")
        
        # Open the app URL
        print("\n🌐 Opening your app in browser...")
        import webbrowser
        webbrowser.open("https://aistethxyz-design.github.io/medical-billing-rag/")
        
    else:
        print(f"\n❌ Push failed: {stderr}")
        print("\n💡 Troubleshooting:")
        print("1. Check if the token has 'repo' scope")
        print("2. Verify the repository exists and is accessible")
        print("3. Try generating a new token if this one is expired")

if __name__ == "__main__":
    main()

