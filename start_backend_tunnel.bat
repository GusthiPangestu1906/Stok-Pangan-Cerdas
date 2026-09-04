@echo off
title Stok Pangan Cerdas - Backend & Cloudflare Tunnel
echo ========================================================
echo   MENJALANKAN BACKEND LARAVEL DAN CLOUDFLARE TUNNEL
echo   Database: Neon PostgreSQL (Cloud)
echo ========================================================
echo.

cd /d "%~dp0backend"
start "Laravel Server" cmd /k "php artisan serve --host=127.0.0.1 --port=8000"

timeout /t 3 >nul

cd /d "%~dp0"
echo Membuka Tunnel Cloudflare...
start "Cloudflare Tunnel" cmd /k "..\cloudflared.exe tunnel --url http://127.0.0.1:8000"

echo.
echo Selesai! Backend aktif di port 8000 dan terhubung ke internet.
pause
