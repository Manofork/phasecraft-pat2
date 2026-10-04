@echo off
cd /d "%~dp0"
echo ============================================
echo   PhaseCraft Trainer, Android project setup
echo ============================================
echo.
echo This installs the tools needed to open the Android project,
echo then opens it in Android Studio.
echo.
echo Requirements before running this:
echo   1. Node.js (https://nodejs.org, choose the LTS version)
echo   2. Android Studio (https://developer.android.com/studio)
echo.
echo Press any key to begin...
pause >nul

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo Node.js was not found. Install it from https://nodejs.org and run this again.
    pause
    exit /b 1
)

echo.
echo Installing project tools, this can take a minute...
call npm install
if errorlevel 1 (
    echo.
    echo npm install failed. Check the messages above.
    pause
    exit /b 1
)

echo.
echo Syncing the web app into the Android project...
call npx cap sync android
if errorlevel 1 (
    echo.
    echo cap sync failed. Check the messages above.
    pause
    exit /b 1
)

echo.
echo Opening Android Studio...
call npx cap open android

echo.
echo If Android Studio opened, wait for it to finish "Gradle sync" in the
echo bottom status bar, then use Run (green play button) to install the
echo app on a connected phone or emulator, or Build, Build APK(s) to
echo produce an installable file.
echo.
pause
