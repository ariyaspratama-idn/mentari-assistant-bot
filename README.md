# 🤖 Bot Asisten Mentari UNPAM

Bot Telegram otomatis untuk memantau tugas, forum diskusi, UTS, dan UAS di LMS **Mentari UNPAM**.

## ✨ Fitur
- 📝 Notifikasi otomatis tugas baru
- 💬 Notifikasi forum diskusi baru  
- ⚠️ Pengingat deadline H-3 dan H-1
- 🔑 Peringatan kadaluarsa token H-7 dan H-1
- 24/7 via Vercel Cron Job

## 🛠 Teknologi
- Node.js + Axios
- TiDB Cloud (MySQL)
- Telegram Bot API
- Vercel (hosting + cron)

## 🚀 Setup
Lihat [SETUP.md](SETUP.md) untuk instruksi lengkap.

## 📋 Environment Variables
```
MENTARI_JWT=          # JWT token dari localStorage Mentari
MENTARI_NIM=          # NIM mahasiswa
MENTARI_PASSWORD=     # Password Mentari
BOT_TOKEN=            # Token Telegram bot
CHAT_ID=              # Telegram Chat ID
TIDB_HOST=            # Host TiDB Cloud
TIDB_PORT=            # Port TiDB
TIDB_USER=            # Username TiDB
TIDB_PASSWORD=        # Password TiDB
TIDB_DATABASE=        # Nama database
CF_CLEARANCE=         # Cookie Cloudflare
SL_SESSION=           # Session cookie Mentari
```

## ⚠️ Pembaruan Token
JWT token berlaku ~90 hari. Bot akan mengirim notifikasi Telegram H-7 dan H-1 sebelum kadaluarsa.

Untuk memperbarui:
1. Login ke https://mentari.unpam.ac.id
2. Buka F12 → Console
3. Jalankan: `JSON.parse(localStorage.getItem('access'))[0].token`
4. Update `MENTARI_JWT` di Vercel Environment Variables
