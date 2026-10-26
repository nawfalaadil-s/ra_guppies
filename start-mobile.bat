@echo off
setlocal EnableDelayedExpansion

:: -----------------------------------------------------------------------------
:: RA GUPPY — LOCAL MOBILE DEVELOPMENT SERVER LAUNCHER
:: Enables Android and iPhone access on your local Wi-Fi without cloud hosting
:: -----------------------------------------------------------------------------

title RA GUPPY - Mobile Local Dev Server (Port 5173)

:: Step 1: Change to the project directory
cd /d "%~dp0"

echo ===============================================================================
echo                RA GUPPY - LOCAL MOBILE DEVELOPMENT SERVER
echo ===============================================================================
echo.

:: Step 2: Check Node.js availability
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo.
    echo Node.js is required to run the RA GUPPY local development server.
    echo Please download and install the LTS version from:
    echo   https://nodejs.org/
    echo.
    echo After installing, restart this script.
    echo.
    pause
    exit /b 1
)

:: Step 3: Check npm availability
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm package manager is not found on your system!
    echo Please make sure Node.js and npm are added to your PATH.
    echo.
    pause
    exit /b 1
)

:: Step 4: Check if project dependencies are installed
if not exist "node_modules\" (
    echo [WARNING] Project dependencies are missing (node_modules directory not found).
    echo.
    echo Before running for the first time, install the required packages:
    echo   Run: npm install
    echo.
    echo Would you like to run 'npm install' now?
    set /p INSTALL_CHOICE="Install dependencies now? (Y/N): "
    if /i "!INSTALL_CHOICE!"=="Y" (
        echo.
        echo Installing dependencies using npm install...
        call npm install
        if %errorlevel% neq 0 (
            echo.
            echo [ERROR] 'npm install' encountered an issue. Please review the output above.
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo Cancelled. Please run 'npm install' manually, then run start-mobile.bat again.
        pause
        exit /b 1
    )
)

:: Step 5: Detect the PC's local IPv4 address
set PC_IP=
for /f "usebackq delims=" %%i in (`node -e "const os = require('os'); const nets = os.networkInterfaces(); for (const name of Object.keys(nets)) { for (const net of nets[name]) { if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) { console.log(net.address); process.exit(0); } } }"` ) do (
    set PC_IP=%%i
)

:: Fallback if node lookup returned empty
if "%PC_IP%"=="" (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "169.254"') do (
        for /f "tokens=1" %%b in ("%%a") do (
            if "!PC_IP!"=="" set PC_IP=%%b
        )
    )
)

:: Step 6: Display Connection Instructions
echo [SUCCESS] Environment verified. Server is ready to launch on local network.
echo.
echo -------------------------------------------------------------------------------
echo   CONNECTION URLS:
echo -------------------------------------------------------------------------------
echo   Desktop Browser:    http://localhost:5173/
if not "%PC_IP%"=="" (
echo   Mobile Phone Browser: http://!PC_IP!:5173/
) else (
echo   Mobile Phone Browser: http://^<YOUR_PC_IP^>:5173/
)
echo -------------------------------------------------------------------------------
echo.
echo HOW TO CONNECT FROM YOUR ANDROID OR IPHONE:
echo   1. Make sure your phone is connected to the SAME Wi-Fi network as this PC.
echo   2. Open Chrome (Android) or Safari (iPhone) on your phone.
if not "%PC_IP%"=="" (
echo   3. Type the following URL into your phone's address bar:
echo        http://!PC_IP!:5173/
) else (
echo   3. Find your PC IPv4 address by opening another terminal and running 'ipconfig',
echo      then visit: http://^<YOUR_PC_IP^>:5173/
)
echo.
echo TROUBLESHOOTING FIREWALL (If phone shows "Site can't be reached"):
echo   Windows Defender Firewall may block incoming connections on port 5173.
echo   To allow local access, run PowerShell as Administrator and paste:
echo     New-NetFirewallRule -DisplayName "RA GUPPY Dev" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Private
echo   Detailed instructions are in MOBILE-ACCESS-GUIDE.md.
echo.
echo ===============================================================================
echo Starting Vite server on 0.0.0.0:5173... Press Ctrl+C to stop the server.
echo ===============================================================================
echo.

:: Step 7: Launch Vite server binding to all network interfaces
call npm run dev -- --host 0.0.0.0

:: Step 8: Keep terminal open if the server terminates or encounters an error
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The server exited with error code %errorlevel%.
)
echo.
echo Press any key to close this window...
pause >nul
