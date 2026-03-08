# PANDUAN CEPAT: Jika Bot Kena Blokir (Error 403)

Jika Boss merasa bot tidak mengirim pesan atau saat tes manual muncul "403 Forbidden", ikuti 3 langkah kilat ini:

### 1. Ambil Token Baru dari Browser
Buka Mentari di Chrome, tekan **F12** -> **Console**, lalu tempel kode ini:
```javascript
(function() {
    const jwt = localStorage.getItem('token');
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});
    console.log(`\nMENTARI_JWT=${jwt}\nCF_CLEARANCE=${cookies['cf_clearance']}\nSTOKEN=${cookies['stoken']}\nSL_SESSION=${cookies['sl-session']}`);
    alert("Token Berhasil Diambil!");
})();
```

### 2. Update File .env di Laptop
Buka file `.env` di folder bot ini, lalu ganti nilai yang lama dengan hasil dari Console tadi:
- `MENTARI_JWT=...`
- `CF_CLEARANCE=...`
- `STOKEN=...`
- `SL_SESSION=...`

### 3. Tes Ulang
Buka CMD di folder ini, lalu ketik:
```bash
node bot.js
```
Jika muncul "Siklus selesai", berarti bot sudah NORMAL kembali!

---
*Catatan: Bot sudah disetel "Diam" (tidak lapor) jika kena 403 agar tidak berisik di Telegram.*
