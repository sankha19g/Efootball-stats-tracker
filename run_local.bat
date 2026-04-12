@echo off
setlocal
echo Cleaning up existing processes on Port 5001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
    echo Killing process %%a...
    taskkill /F /PID %%a 2>nul
)

echo Starting eFootball Stats Tracker Local Development...

:: Start Backend
start "eFootball Backend" cmd /k "cd server && npm run dev"

:: Start Frontend
start "eFootball Frontend" cmd /k "cd client && npm run dev"

echo.
echo Backend and Frontend are starting in separate windows.
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173 (usually)
echo.
pause
