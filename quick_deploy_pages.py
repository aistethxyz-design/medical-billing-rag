#!/usr/bin/env python3
"""
Quick Deploy to GitHub Pages with Token
"""
import subprocess
import sys
import os

def run_cmd(cmd):
    """Run command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    print("🚀 Quick Deploy to GitHub Pages")
    print("=" * 50)
    
    # Set the token (use environment variable for security)
    token = os.getenv('GITHUB_TOKEN', 'your_github_token_here')
    if token == 'your_github_token_here':
        token = input("Please enter your GitHub Personal Access Token: ").strip()
    
    # Configure git remote with token
    print("🔧 Configuring git remote...")
    remote_url = f"https://aistethxyz-design:{token}@github.com/aistethxyz-design/medical-billing-rag.git"
    success, _, error = run_cmd(f'git remote set-url origin "{remote_url}"')
    
    if not success:
        print(f"❌ Failed to set remote: {error}")
        return
    
    print("✅ Git remote configured")
    
    # Add all files
    print("📁 Adding files...")
    success, _, error = run_cmd("git add .")
    if not success:
        print(f"❌ Failed to add files: {error}")
        return
    
    print("✅ Files added")
    
    # Commit changes
    print("💾 Committing changes...")
    success, _, error = run_cmd('git commit -m "Setup GitHub Pages hosting with React frontend and chatbot"')
    
    if not success:
        if "nothing to commit" in error:
            print("ℹ️ No changes to commit")
        else:
            print(f"❌ Commit failed: {error}")
            return
    else:
        print("✅ Changes committed")
    
    # Push to GitHub
    print("🚀 Pushing to GitHub...")
    success, output, error = run_cmd("git push origin clean-master")
    
    if success:
        print("🎉 Successfully deployed to GitHub!")
        print("\n" + "=" * 50)
        print("🌐 WEBSITE HOSTING SETUP")
        print("=" * 50)
        
        print("\n📋 Manual Steps Required:")
        print("1. Go to: https://github.com/aistethxyz-design/medical-billing-rag/settings/pages")
        print("2. Under 'Source', select 'GitHub Actions'")
        print("3. Save the settings")
        
        print("\n⏳ Then wait for deployment:")
        print("• Check: https://github.com/aistethxyz-design/medical-billing-rag/actions")
        print("• Deployment takes 3-5 minutes")
        
        print("\n🌟 Your websites will be live at:")
        print("• Main Site: https://aistethxyz-design.github.io/medical-billing-rag/")
        print("• Chatbot: https://aistethxyz-design.github.io/medical-billing-rag/chatbot/")
        
        print("\n🔐 Demo Credentials:")
        print("• Email: demo@aisteth.com")
        print("• Password: demo123")
        
    else:
        print(f"❌ Push failed: {error}")
        print("\n💡 Troubleshooting:")
        print("• Check if the token is valid")
        print("• Make sure token has 'repo' and 'workflow' permissions")

if __name__ == "__main__":
    main()
