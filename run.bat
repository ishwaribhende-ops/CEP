@echo off
title Road Complaint System - CEP (Varale, Pune)
echo =====================================================================
echo       Road Complaint System - Community Engagement Project (CEP)
echo                     Location: Varale, Pune
echo =====================================================================
echo.
echo [1/2] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found on your system! Please install Python 3.
    pause
    exit /b 1
)

echo [2/2] Launching Road Complaint System Prototype...
start http://127.0.0.1:5000
python app.py
pause

