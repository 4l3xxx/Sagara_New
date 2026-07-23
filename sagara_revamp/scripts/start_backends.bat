@echo off
echo ==========================================
echo  SAGARA BACKEND MASTER STARTER
echo ==========================================
echo.

REM Change to project root (one level up from scripts/)
cd /d "%~dp0.."

echo [1/3] Starting Go Backend...
if exist .env (
  for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
    if not "%%a"=="" set "%%a=%%b"
  )
)
start "Go Backend"   cmd /k "cd sagara-backend && go run cmd/server/main.go"

echo [2/3] Starting Python NLP Service...
start "Python NLP"   cmd /k "cd nlp_service && python app.py"

echo [3/3] Starting Node.js Web Server...
start "Node Server"  cmd /k "node server.js"

echo.
echo ==========================================
echo  ALL SERVICES ARE STARTING IN NEW WINDOWS
echo  Open browser: http://localhost:3000
echo  Admin panel:  http://localhost:3000/admin/login
echo ==========================================
pause
