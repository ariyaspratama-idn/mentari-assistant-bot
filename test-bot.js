require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const JWT = process.env.MENTARI_JWT;
const CF = process.env.CF_CLEARANCE;
const SL = process.env.SL_SESSION;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const api = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Authorization': `Bearer ${JWT}`,
        'Cookie': `cf_clearance=${CF}; sl-session=${SL}`,
        'Accept': 'application/json',
        'Referer': 'https://mentari.unpam.ac.id/dashboard',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
    }
});

async function sendTelegram(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        console.log('✅ Pesan Telegram terkirim');
    } catch (e) {
        console.error('❌ Gagal kirim Telegram:', e.message);
    }
}

async function main() {
    console.log('=== MENTARI BOT TEST ===\n');

    try {
        // 1. Ambil semester aktif
        const semR = await api.get('/api/semester');
        const activeSem = semR.data.data.find(s => s.active);
        console.log('Semester aktif:', activeSem.nama_semester);

        // 2. Ambil daftar mata kuliah
        const courseR = await api.get('/api/user-course');
        const courses = courseR.data.data;
        console.log(`Mata kuliah: ${courses.length}`);

        // 3. Simpan data
        fs.writeFileSync('courses_data.json', JSON.stringify(courses, null, 2));

        // 4. Kirim notifikasi Telegram
        let msg = `🎓 <b>Bot Asisten Mentari Aktif!</b>\n\n`;
        msg += `📅 <b>Semester:</b> ${activeSem.nama_semester}\n`;
        msg += `📚 <b>Mata Kuliah (${courses.length}):</b>\n\n`;

        courses.forEach((c, i) => {
            msg += `${i + 1}. <b>${c.nama_mata_kuliah}</b>\n`;
            msg += `   📌 ${c.id_kelas} | ${c.nama_hari} | ${c.sks} SKS\n\n`;
        });

        msg += `\n⏰ <i>Bot aktif memantau tugas dan forum diskusi...</i>\n`;
        msg += `✅ <i>Koneksi berhasil: ${new Date().toLocaleString('id-ID')}</i>`;

        await sendTelegram(msg);
        console.log('\nBot berhasil berjalan!');

    } catch (e) {
        console.error('Error:', e.message);
        await sendTelegram(`⚠️ <b>Error Bot Mentari:</b>\n${e.message}`);
    }
}

main();
