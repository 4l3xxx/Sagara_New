@echo off
echo ==========================================
echo SAGARA BACKEND MASTER STARTER
echo ==========================================

echo [1/3] Menyambungkan ke Go Backend...
start "Go Backend" cmd /k "cd sagara-backend && go run cmd/server/main.go"

echo [2/3] Menyambungkan ke Python NLP Service...
start "Python NLP" cmd /k "cd nlp_service && python app.py"

echo [3/3] Menyambungkan ke Node.js Web Server...
start "Node Server" cmd /k "node server.js"

echo ==========================================
echo SEMUA SERVICE SUDAH JALAN DI JENDELA BARU!
echo Buka browser ke http://localhost:3000
echo ==========================================
pause
