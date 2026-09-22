@echo off
title Sistem Manajemen Kos Lokal
chcp 65001 > nul
cls

echo ==========================================================
echo       SISTEM MANAJEMEN KOS LOKAL (KOSMANAGER)
echo ==========================================================
echo.
echo [1/2] Memeriksa instalasi Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang di komputer ini.
    echo Silakan unduh dan pasang Node.js dari https://nodejs.org
    pause
    exit /b
)

echo [2/2] Menjalankan Server Manajemen Kos...
echo.

:: Membuka browser otomatis setelah delay 2 detik di background
start "" /b powershell -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5000'"

:: Menjalankan server node
node server\index.js

pause
