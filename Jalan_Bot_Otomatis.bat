@echo off
title Mentari Bot Assistant - LOKAL MODE
cd /d %~dp0
:loop
cls
echo ==========================================
echo    MENTARI BOT SEDANG BERJALAN...
echo ==========================================
echo Waktu: %date% %time%
node bot.js
echo ==========================================
echo Sukses! Bot akan mengecek lagi dlm 1 jam.
echo Jangan tutup jendela ini agar bot tetap jalan.
echo ==========================================
timeout /t 3600
goto loop
