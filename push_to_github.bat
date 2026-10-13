@echo off
title Push to GitHub - Smart College Transportation
echo ========================================================
echo   Pushing project to GitHub:
echo   https://github.com/24eg105g17-byte/smartcollegetransportationn
echo ========================================================
echo.

set "GIT_EXE=C:\Users\SaiChandana Gokaraju\AppData\Local\GitHubDesktop\app-3.6.1\resources\app\git\cmd\git.exe"

"%GIT_EXE%" push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   [SUCCESS] Pushed to GitHub repository!
    echo   https://github.com/24eg105g17-byte/smartcollegetransportationn
    echo ========================================================
) else (
    echo ========================================================
    echo   [FAILED] Push failed. Check credentials above.
    echo ========================================================
)
echo.
pause
