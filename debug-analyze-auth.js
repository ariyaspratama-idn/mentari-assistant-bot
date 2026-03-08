require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const CF = process.env.CF_CLEARANCE;
const SL = process.env.SL_SESSION;
const STOKEN = process.env.STOKEN;
const cookieString = `cf_clearance=${CF}; sl-session=${SL}; stoken=${STOKEN}`;

const client = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Cookie': cookieString,
        'Accept': 'application/json'
    }
});

async function analyzeAuth() {
    try {
        // Ambil JS utama
        const home = await client.get('/');
        const jsMatch = home.data.match(/src="(\/assets\/index-[^"]+\.js)"/);
        if (!jsMatch) {
            console.log('File JS tidak ditemukan.');
            return;
        }

        const jsResp = await client.get(jsMatch[1]);
        const js = jsResp.data;

        // Cari pola penggunaan stoken / token dalam request
        console.log('=== Pola Authorization ===');
        const authPatterns = js.match(/Authorization[^;,)]{0,200}/g);
        if (authPatterns) {
            const unique = [...new Set(authPatterns)];
            unique.slice(0, 10).forEach(p => console.log(p.substring(0, 200), '\n'));
        }

        // Cari cara Bearer token digunakan
        console.log('\n=== Pola Bearer ===');
        const bearerPatterns = js.match(/Bearer[^'"]{0,100}/g);
        if (bearerPatterns) {
            const unique = [...new Set(bearerPatterns)];
            unique.forEach(p => console.log(p.substring(0, 150), '\n'));
        }

        // Cari bagaimana stoken dipakai
        console.log('\n=== Pola stoken ===');
        const stokenPatterns = js.match(/stoken[^;,()]{0,200}/g);
        if (stokenPatterns) {
            const unique = [...new Set(stokenPatterns)];
            unique.slice(0, 10).forEach(p => console.log(p.substring(0, 200), '\n'));
        }

        // Cari semua header yang diset
        console.log('\n=== Header yang di-set ===');
        const headerPatterns = js.match(/headers[^;{]{0,200}/g);
        if (headerPatterns) {
            const unique = [...new Set(headerPatterns)];
            unique.slice(0, 10).forEach(p => console.log(p.substring(0, 200), '\n'));
        }

    } catch (e) {
        console.error('Gagal:', e.message);
    }
}

analyzeAuth();
