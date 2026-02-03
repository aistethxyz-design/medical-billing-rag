@echo off
echo Starting AISteth Web Interface...
echo.
echo Access the application at: http://localhost:8501
echo.
cd /d "%~dp0"
"C:\Users\mehul\AppData\Local\Programs\Python\Python313\python.exe" -m streamlit run app_pinecone.py
pause

