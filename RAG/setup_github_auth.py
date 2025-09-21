#!/usr/bin/env python3
"""
GitHub Authentication Setup Script
This script helps you set up GitHub authentication for pushing code.
"""

import webbrowser
import subprocess
import os
import sys

def main():
    print("🔐 GitHub Authentication Setup")
    print("=" * 50)
    
    print("\n📋 Step 1: Generate Personal Access Token")
    print("1. Go to: https://github.com/settings/tokens")
    print("2. Click 'Generate new token' > 'Generate new token (classic)'")
    print("3. Give it a name: 'Medical Billing RAG'")
    print("4. Select scopes: 'repo' (Full control of private repositories)")
    print("5. Click 'Generate token'")
    print("6. Copy the token (it starts with 'ghp_')")
    
    # Open the GitHub tokens page
    webbrowser.open("https://github.com/settings/tokens")
    
    print("\n⏳ Waiting for you to generate the token...")
    input("Press Enter after you've copied the token...")
    
    # Get the token from user
    token = input("\n🔑 Paste your Personal Access Token here: ").strip()
    
    if not token.startswith('ghp_'):
        print("❌ Invalid token format. Token should start with 'ghp_'")
        return
    
    print("\n🔧 Setting up Git authentication...")
    
    # Set up the remote URL with token
    repo_url = f"https://aistethxyz@gmail.com:{token}@github.com/aistethxyz-design/medical-billing-rag.git"
    
    try:
        # Set the remote URL
        subprocess.run(["git", "remote", "set-url", "origin", repo_url], check=True)
        print("✅ Remote URL updated with token")
        
        # Test the connection
        print("🧪 Testing connection...")
        result = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("🎉 Successfully pushed to GitHub!")
            print("🌐 Your app should be live at: https://aistethxyz-design.github.io/medical-billing-rag/")
        else:
            print("❌ Push failed:")
            print(result.stderr)
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
