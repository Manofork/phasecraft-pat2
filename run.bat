@echo off
setlocal

echo ============================================
echo   PhaseCraft, quick run (no installer)
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found on this computer.
    echo Please install it from https://nodejs.org (choose the LTS version), then run this file again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing required packages, this only happens once and needs an internet connection.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo Something went wrong during npm install. Check the messages above.
        pause
        exit /b 1
    )
)

echo.
echo Opening PhaseCraft...
echo.
call npm start
pause
