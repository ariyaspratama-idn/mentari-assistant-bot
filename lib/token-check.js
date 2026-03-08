/**
 * Token Expiry Checker
 * Memeriksa masa berlaku JWT token dan mengirim notifikasi Telegram
 * jika token akan kadaluarsa dalam 7 hari atau 1 hari.
 */

const dayjs = require('dayjs');

function decodeJWT(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = Buffer.from(payload, 'base64url').toString('utf8');
        return JSON.parse(decoded);
    } catch (e) {
        return null;
    }
}

async function checkTokenExpiry(jwtToken, sendTelegramFn) {
    const payload = decodeJWT(jwtToken);
    if (!payload || !payload.exp) {
        console.log('Tidak bisa membaca exp dari JWT token.');
        return;
    }

    const expiryDate = dayjs.unix(payload.exp);
    const now = dayjs();
    const daysLeft = expiryDate.diff(now, 'day');
    const hoursLeft = expiryDate.diff(now, 'hour');

    console.log(`⏳ Token berlaku hingga: ${expiryDate.format('DD MMM YYYY HH:mm')}`);
    console.log(`⏳ Sisa: ${daysLeft} hari (${hoursLeft} jam)`);

    // Notifikasi H-7 (antara 155-169 jam)
    if (hoursLeft >= 155 && hoursLeft <= 169) {
        const msg = `⚠️ <b>PERINGATAN: Token Mentari Akan Kadaluarsa!</b>\n\n` +
            `🔑 Token JWT Mentari Anda akan kadaluarsa dalam:\n` +
            `📅 <b>7 hari lagi</b> (${expiryDate.format('DD MMM YYYY HH:mm')})\n\n` +
            `<b>Untuk memperbarui token:</b>\n` +
            `1. Buka https://mentari.unpam.ac.id\n` +
            `2. Login dengan NIM/password\n` +
            `3. Tekan F12 → Console\n` +
            `4. Jalankan:\n` +
            `<code>JSON.parse(localStorage.getItem('access'))[0].token</code>\n` +
            `5. Salin hasilnya dan perbarui MENTARI_JWT di Vercel\n\n` +
            `⏰ Jangan sampai lupa, bot akan berhenti jika token kadaluarsa!`;

        await sendTelegramFn(msg);
        console.log('🔔 Notifikasi H-7 kadaluarsa token terkirim');
    }

    // Notifikasi H-1 (antara 23-25 jam)
    if (hoursLeft >= 23 && hoursLeft <= 25) {
        const msg = `🚨 <b>DARURAT: Token Mentari Kadaluarsa BESOK!</b>\n\n` +
            `🔑 Token JWT Mentari Anda akan kadaluarsa dalam:\n` +
            `⏰ <b>Kurang dari 24 jam!</b> (${expiryDate.format('DD MMM YYYY HH:mm')})\n\n` +
            `<b>SEGERA perbarui token sekarang:</b>\n` +
            `1. Buka https://mentari.unpam.ac.id\n` +
            `2. Login → F12 → Console\n` +
            `3. Jalankan: <code>JSON.parse(localStorage.getItem('access'))[0].token</code>\n` +
            `4. Update MENTARI_JWT di Vercel Environment Variables\n` +
            `5. Redeploy proyek Vercel\n\n` +
            `⛔ Bot AKAN BERHENTI jika tidak segera diperbarui!`;

        await sendTelegramFn(msg);
        console.log('🔔 Notifikasi H-1 kadaluarsa token terkirim');
    }

    return { daysLeft, expiryDate: expiryDate.format('DD MMM YYYY HH:mm') };
}

module.exports = { checkTokenExpiry, decodeJWT };
