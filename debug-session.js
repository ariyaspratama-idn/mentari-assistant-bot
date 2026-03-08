require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const CF = process.env.CF_CLEARANCE;
const SL = process.env.SL_SESSION;

console.log('CF_CLEARANCE ada?', CF ? 'YA, panjang=' + CF.length : 'TIDAK');
console.log('SL_SESSION ada?', SL ? 'YA, panjang=' + SL.length : 'TIDAK');

const cookieString = `cf_clearance=${CF}; sl-session=${SL}`;

const client = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Cookie': cookieString
    }
});

async function testSession() {
    try {
        console.log('\nMencoba akses /dashboard...');
        const resp = await client.get('/dashboard');

        // Simpan HTML untuk dianalisis
        fs.writeFileSync('debug_dashboard.html', resp.data);

        // Cek apakah sudah login
        const body = resp.data;
        console.log('URL terakhir:', resp.request.path);
        console.log('Status HTTP:', resp.status);
        console.log('Mengandung "logout"?', body.includes('logout'));
        console.log('Mengandung "dashboard"?', body.toLowerCase().includes('dashboard'));
        console.log('Mengandung "login"?', body.toLowerCase().includes('login'));
        console.log('Mengandung "ariyas"?', body.toLowerCase().includes('ariyas'));
        console.log('Mengandung "231011"?', body.includes('231011'));

        console.log('\nPetikan HTML (500 karakter pertama):');
        console.log(body.substring(0, 500));
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.log('Status:', err.response.status);
            console.log('URL:', err.response.config.url);
        }
    }
}

testSession();
