@echo off
cd /d "%~dp0"
set LOGFILE=%~dp0build_log.txt

echo ============================================> "%LOGFILE%"
echo   PhaseCraft Build Setup>>"%LOGFILE%"
echo ============================================>>"%LOGFILE%"
echo.>>"%LOGFILE%"
echo Working folder: %cd%>>"%LOGFILE%"
echo CHECKPOINT 1: script started>>"%LOGFILE%"

echo PhaseCraft Build Setup
echo Working folder: %cd%
echo.
echo Press any key to begin...
pause >nul
echo CHECKPOINT 2: first pause passed>>"%LOGFILE%"

echo Checking for Node.js, please wait...
node --version >>"%LOGFILE%" 2>&1
echo CHECKPOINT 3: node check done, errorlevel=%errorlevel%>>"%LOGFILE%"
if errorlevel 1 goto NODE_MISSING

echo Node.js found, continuing.
echo CHECKPOINT 4: node found, continuing>>"%LOGFILE%"

if exist "node_modules" goto SKIP_INSTALL

echo Installing required packages, this can take a minute...
echo CHECKPOINT 5: running npm install>>"%LOGFILE%"
call npm install >>"%LOGFILE%" 2>&1
echo CHECKPOINT 6: npm install done, errorlevel=%errorlevel%>>"%LOGFILE%"
if errorlevel 1 goto INSTALL_FAILED
goto BUILD

:SKIP_INSTALL
echo node_modules already present, skipping npm install.
echo CHECKPOINT 5b: node_modules already present, skipping npm install>>"%LOGFILE%"

:BUILD
echo Building the Windows installer and portable exe, this can take a minute or two...
echo CHECKPOINT 7: running npm run dist>>"%LOGFILE%"
call npm run dist >>"%LOGFILE%" 2>&1
echo CHECKPOINT 8: npm run dist done, errorlevel=%errorlevel%>>"%LOGFILE%"
if errorlevel 1 goto BUILD_FAILED

echo.
echo Done. Look inside the "dist" folder for two files:
echo   PhaseCraft Setup 1.0.0.exe   (installer, puts PhaseCraft in the Start Menu)
echo   PhaseCraft 1.0.0.exe         (portable, runs directly, no install needed)
echo Full log saved to build_log.txt
echo CHECKPOINT 9: build succeeded>>"%LOGFILE%"
echo.
pause
exit /b 0

:NODE_MISSING
echo.
echo Node.js was not found on this computer.
echo Please install it from https://nodejs.org (choose the LTS version), then run this file again.
echo Details were saved to build_log.txt
echo.
pause
exit /b 1

:INSTALL_FAILED
echo.
echo npm install failed. Details were saved to build_log.txt
echo.
pause
exit /b 1

:BUILD_FAILED
echo.
echo Build failed. Details were saved to build_log.txt
echo.
pause
exit /b 1
