#!/usr/bin/env python3
"""
Quick Push to GitHub - Fix all authentication issues
"""

import subprocess
import os
import sys

def run_cmd(cmd):
    """Run command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(f"Running: {cmd}")
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("🚀 Quick Push to GitHub")
    print("=" * 40)
    
    # Step 1: Configure git user
    print("🔧 Step 1: Configuring Git user...")
    run_cmd('git config user.name "aistethxyz-design"')
    run_cmd('git config user.email "aistethxyz@gmail.com"')
    
    # Step 2: Set up remote with token
    print("🔧 Step 2: Setting up remote with token...")
    token = os.getenv('GITHUB_TOKEN', 'your_github_token_here')
    remote_url = f"https://{token}@github.com/aistethxyz-design/medical-billing-rag.git"
    run_cmd(f'git remote set-url origin "{remote_url}"')
    
    # Step 3: Add and commit
    print("📁 Step 3: Adding and committing changes...")
    run_cmd("git add .")
    run_cmd('git commit -m "Deploy Medical Billing RAG to GitHub Pages"')
    
    # Step 4: Push
    print("🚀 Step 4: Pushing to GitHub...")
    if run_cmd("git push origin main"):
        print("\n🎉 SUCCESS!")
        print("🌐 Your app will be live at:")
        print("   https://aistethxyz-design.github.io/medical-billing-rag/")
        print("🔐 Login: aistethxyz@gmail.com / bestaisteth")
    else:
        print("❌ Push failed!")

if __name__ == "__main__":
    main()

