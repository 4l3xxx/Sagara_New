@echo off
echo ==========================================
echo SAGARA BACKEND MASTER STARTER
echo ==========================================

echo [1/2] Menyambungkan ke Go Backend...
start "Go Backend" cmd /k "cd sagara-backend && go run cmd/server/main.go"

echo [2/2] Menyambungkan ke Python NLP Service...
start "Python NLP" cmd /k "cd nlp_service && python app.py"

echo ==========================================
echo SEMUA BACKEND SUDAH JALAN DI JENDELA BARU!
echo Coach tinggal jalankan 'node server.js' di terminal utama.
echo ==========================================
pause
