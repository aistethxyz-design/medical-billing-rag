@echo off
echo 🏥 Medical Billing RAG Assistant
echo ================================
echo.

REM Check if CSV file exists
if not exist "Codes by class.csv" (
    echo ❌ Error: 'Codes by class.csv' not found!
    echo Please ensure the billing codes CSV file is in the same directory.
    pause
    exit /b 1
)

echo 📊 Installing required packages...
py -m pip install -r requirements.txt

echo.
echo 🚀 Starting the application...
echo The app will open in your default web browser.
echo Press Ctrl+C to stop the application.
echo ================================
echo.

py -m streamlit run billing_rag_system.py --server.port 8501 --server.address localhost

pause
