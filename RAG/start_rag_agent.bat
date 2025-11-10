@echo off
echo ========================================
echo Starting Medical Billing RAG Agent
echo ========================================
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.

REM Try different Python commands
echo Checking for Python...
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Found: python
    python --version
    echo.
    echo Starting Streamlit app on port 8501...
    python -m streamlit run app.py --server.port 8501
    goto :end
)

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Found: py
    py --version
    echo.
    echo Starting Streamlit app on port 8501...
    py -m streamlit run app.py --server.port 8501
    goto :end
)

echo ERROR: Python not found!
echo Please install Python or add it to your PATH
echo.
pause
exit /b 1

:end
pause
