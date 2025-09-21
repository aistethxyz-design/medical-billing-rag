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
    repo_url = f"https://aistethxyz-design:{token}@github.com/aistethxyz-design/medical-billing-rag.git"
    
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
    success, stdout, stderr = run_command('git commit -m "Configure GitHub Pages deployment with frontend and chatbot"')
    
    if not success:
        if "nothing to commit" in stderr:
            print("ℹ️ No changes to commit")
        else:
            print(f"❌ Failed to commit: {stderr}")
            return
    else:
        print("✅ Changes committed")
    
    # Push to GitHub
    print("🚀 Pushing to GitHub...")
    success, stdout, stderr = run_command("git push origin clean-master")
    
    if success:
        print("🎉 Successfully pushed to GitHub!")
        print("\n🌐 GitHub Pages Setup:")
        print("1. Go to: https://github.com/aistethxyz-design/medical-billing-rag/settings/pages")
        print("2. Under 'Source', select 'GitHub Actions'")
        print("3. The deployment will start automatically")
        print("\n📋 Your website will be available at:")
        print("🌟 Main Site: https://aistethxyz-design.github.io/medical-billing-rag/")
        print("� Chatbot: https://aistethxyz-design.github.io/medical-billing-rag/chatbot/")
        print("\n🔐 Demo Login Credentials:")
        print("   Email: demo@aisteth.com")
        print("   Password: demo123")
        
        print("\n📋 Next steps:")
        print("1. Go to: https://github.com/aistethxyz-design/medical-billing-rag/actions")
        print("2. Check if the 'Deploy to GitHub Pages' workflow is running")
        print("3. Wait for it to complete (usually 3-5 minutes)")
        print("4. Visit your live website!")
        
    else:
        print(f"❌ Push failed: {stderr}")
        print("\n💡 The token might have expired or have insufficient permissions")
        print("   Make sure the token has 'repo' and 'workflow' scopes enabled")

if __name__ == "__main__":
    main()
