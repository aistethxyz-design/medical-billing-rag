#!/usr/bin/env python3
"""
Push to GitHub using credentials
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
    print("🚀 Pushing to GitHub...")
    
    # Check if we're in a git repository
    success, stdout, stderr = run_command("git status")
    if not success:
        print("❌ Not in a git repository")
        return
    
    # Add all changes
    print("📁 Adding changes...")
    success, stdout, stderr = run_command("git add .")
    if not success:
        print(f"❌ Failed to add changes: {stderr}")
        return
    
    # Commit changes
    print("💾 Committing changes...")
    success, stdout, stderr = run_command('git commit -m "Fix file structure and add missing files"')
    if not success:
        print(f"❌ Failed to commit: {stderr}")
        return
    
    # Try different authentication methods
    print("🔐 Attempting to push...")
    
    # Method 1: Try with token in URL
    token = input("Enter your GitHub Personal Access Token (or press Enter to skip): ").strip()
    
    if token:
        # Set remote with token
        repo_url = f"https://aistethxyz@gmail.com:{token}@github.com/aistethxyz-design/medical-billing-rag.git"
        success, stdout, stderr = run_command(f"git remote set-url origin {repo_url}")
        
        if success:
            success, stdout, stderr = run_command("git push origin main")
            if success:
                print("🎉 Successfully pushed to GitHub!")
                print("🌐 Your app should be live at: https://aistethxyz-design.github.io/medical-billing-rag/")
                return
            else:
                print(f"❌ Push failed: {stderr}")
    
    # Method 2: Try with credential helper
    print("🔄 Trying alternative method...")
    success, stdout, stderr = run_command("git push origin main")
    
    if success:
        print("🎉 Successfully pushed to GitHub!")
        print("🌐 Your app should be live at: https://aistethxyz-design.github.io/medical-billing-rag/")
    else:
        print(f"❌ Push failed: {stderr}")
        print("\n💡 Alternative: Use GitHub web interface to upload files manually")

if __name__ == "__main__":
    main()
