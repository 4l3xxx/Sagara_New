@echo off
echo ==========================================
echo SAGARA BACKEND MASTER STARTER
echo ==========================================

echo [1/2] Menyambungkan ke Python NLP Service...
start "Python NLP" cmd /k "cd nlp_service && python app.py"

echo [2/2] Menyambungkan ke Node.js Web Server...
start "Node Server" cmd /k "node src/server.js"

echo ==========================================
echo SEMUA SERVICE SUDAH JALAN DI JENDELA BARU!
echo Buka browser ke http://localhost:3000
echo ==========================================
pause
