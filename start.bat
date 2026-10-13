@echo off
title Smart College Transportation System
echo ========================================================
echo   Starting Smart College Transportation System...
echo ========================================================
echo.

start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 2 /nobreak >nul
start "Frontend Client" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5173/

echo.
echo Application started!
echo Frontend: http://localhost:5173/
echo Backend:  http://localhost:5000/
echo.
pause
