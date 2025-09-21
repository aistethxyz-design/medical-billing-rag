#!/usr/bin/env python3
"""
Medical Billing RAG Assistant Launcher
Run this script to start the application
"""

import subprocess
import sys
import os

def check_requirements():
    """Check if required packages are installed."""
    try:
        import streamlit
        import pandas
        import numpy
        import sentence_transformers
        import faiss
        import plotly
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def main():
    """Main launcher function."""
    print("🏥 Medical Billing RAG Assistant")
    print("=" * 40)
    
    # Check if CSV file exists
    if not os.path.exists("Codes by class.csv"):
        print("❌ Error: 'Codes by class.csv' not found!")
        print("Please ensure the billing codes CSV file is in the same directory.")
        return
    
    # Check requirements
    if not check_requirements():
        return
    
    print("🚀 Starting the application...")
    print("The app will open in your default web browser.")
    print("Press Ctrl+C to stop the application.")
    print("=" * 40)
    
    try:
        # Run the Streamlit app
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", 
            "billing_rag_system.py",
            "--server.port", "8501",
            "--server.address", "localhost"
        ])
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except Exception as e:
        print(f"❌ Error starting application: {e}")

if __name__ == "__main__":
    main()
