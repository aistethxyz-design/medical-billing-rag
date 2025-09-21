#!/usr/bin/env python3
"""
Simple browser viewer for the Medical Billing RAG Assistant
Opens the application in a simple browser window within the IDE
"""

import webbrowser
import time
import subprocess
import sys
import threading
from pathlib import Path

def open_browser_viewer():
    """Open the application in a simple browser viewer"""
    print("🌐 Opening Medical Billing RAG Assistant in browser...")
    
    # Start the Streamlit app in the background
    def run_streamlit():
        try:
            subprocess.run([
                sys.executable, "-m", "streamlit", "run", 
                "billing_rag_system.py",
                "--server.port", "8501",
                "--server.address", "localhost",
                "--server.headless", "true"
            ], check=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ Error starting Streamlit: {e}")
    
    # Start Streamlit in a separate thread
    streamlit_thread = threading.Thread(target=run_streamlit, daemon=True)
    streamlit_thread.start()
    
    # Wait a moment for the server to start
    print("⏳ Starting server...")
    time.sleep(5)
    
    # Open the browser
    url = "http://localhost:8501"
    print(f"🚀 Opening {url}")
    
    try:
        webbrowser.open(url)
        print("✅ Browser opened successfully!")
        print("💡 The application should now be visible in your default browser")
        print("🔄 Keep this terminal open to keep the server running")
        print("⏹️  Press Ctrl+C to stop the server")
        
        # Keep the main thread alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n👋 Shutting down server...")
            
    except Exception as e:
        print(f"❌ Error opening browser: {e}")
        print("💡 You can manually open your browser and go to: http://localhost:8501")

def create_html_viewer():
    """Create a simple HTML file that embeds the Streamlit app"""
    html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Billing RAG Assistant</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f0f2f6;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .app-frame {
            width: 100%;
            height: 80vh;
            border: none;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            background: white;
        }
        .status {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #e8f5e8;
            border-radius: 8px;
            border-left: 4px solid #4caf50;
        }
        .instructions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .instructions h3 {
            margin-top: 0;
            color: #856404;
        }
        .instructions ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Medical Billing RAG Assistant</h1>
        <p>AI-powered billing code search and revenue optimization for medical professionals</p>
    </div>
    
    <div class="container">
        <div class="status">
            <strong>🔄 Loading Application...</strong><br>
            If the application doesn't load, make sure the server is running on port 8501
        </div>
        
        <div class="instructions">
            <h3>📋 How to Use:</h3>
            <ul>
                <li><strong>Code Search:</strong> Enter medical terms like "chest pain" or "fracture" to find relevant billing codes</li>
                <li><strong>Revenue Optimizer:</strong> Get AI-powered suggestions for maximum revenue based on patient context</li>
                <li><strong>Analytics:</strong> View revenue patterns and identify high-value billing opportunities</li>
            </ul>
        </div>
        
        <iframe 
            src="http://localhost:8501" 
            class="app-frame"
            title="Medical Billing RAG Assistant"
            onload="document.querySelector('.status').innerHTML='<strong>✅ Application Loaded Successfully!</strong><br>The Medical Billing RAG Assistant is ready to use'">
        </iframe>
        
        <div style="text-align: center; margin-top: 20px; color: #666;">
            <p>💡 <strong>Tip:</strong> If you see a blank page, make sure the Python server is running</p>
            <p>🔄 <strong>Refresh</strong> this page if the application doesn't load initially</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh if the iframe fails to load
        setTimeout(function() {
            const iframe = document.querySelector('.app-frame');
            if (iframe.contentDocument === null || iframe.contentDocument.body.innerHTML.trim() === '') {
                document.querySelector('.status').innerHTML = 
                    '<strong>❌ Connection Failed</strong><br>Make sure the server is running: <code>py -m streamlit run billing_rag_system.py</code>';
            }
        }, 10000);
    </script>
</body>
</html>
    """
    
    with open("billing_app_viewer.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print("📄 Created billing_app_viewer.html")
    return "billing_app_viewer.html"

if __name__ == "__main__":
    print("🏥 Medical Billing RAG Assistant - Browser Viewer")
    print("=" * 60)
    
    choice = input("Choose an option:\n1. Open in default browser\n2. Create HTML viewer file\nEnter choice (1 or 2): ").strip()
    
    if choice == "1":
        open_browser_viewer()
    elif choice == "2":
        html_file = create_html_viewer()
        print(f"✅ Created {html_file}")
        print("💡 Open this file in your browser to view the application")
        webbrowser.open(f"file://{Path(html_file).absolute()}")
    else:
        print("❌ Invalid choice. Please run again and choose 1 or 2.")
