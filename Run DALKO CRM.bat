@echo off
title DALKO CRM
cd /d "%~dp0Main"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org then try again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting DALKO CRM...
echo Browser will open at http://localhost:3000
echo Keep this window open while using the app.
echo.

start "" "http://localhost:3000"
call npm run dev

echo.
echo Server stopped.
pause
