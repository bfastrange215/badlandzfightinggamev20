@echo off
setlocal
cd /d "%~dp0"
title PHILLY BADLANDZ - 3D COMEBACK V20 + RIGGED DAN
color 0C
echo.
echo  ====================================================
echo       PHILLY BADLANDZ - 3D COMEBACK V20 + RIGGED DAN
echo             BEST OF THREE FIGHTING

echo  ====================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js LTS not found. Install from https://nodejs.org/
  start "" https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
 echo Installing required packages...
 call npm install
 if errorlevel 1 (echo Dependency install failed.&pause&exit /b 1)
)
echo Opening the game in fullscreen when the server is ready...
echo Keep this server window running while you play.
echo Browser address: http://localhost:3140
echo.
start "" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0OPEN_GAME_FULLSCREEN.ps1"
set PORT=3140
call node server.js
echo Server stopped.
pause
