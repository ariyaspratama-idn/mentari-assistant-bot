require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const JWT = process.env.MENTARI_JWT;
const CF = process.env.CF_CLEARANCE;
const SL = process.env.SL_SESSION;

const api = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Authorization': `Bearer ${JWT}`,
        'Cookie': `cf_clearance=${CF}; sl-session=${SL}`,
        'Accept': 'application/json',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
    }
});

async function analyzeJSForEndpoints() {
    try {
        // Ambil halaman utama untuk cari script JS
        const home = await api.get('/');
        const jsMatch = home.data.match(/src="(\/assets\/index-[^"]+\.js)"/);
        if (!jsMatch) { console.log('Tidak menemukan JS'); return; }

        console.log('File JS:', jsMatch[1]);
        const jsResp = await api.get(jsMatch[1]);
        const js = jsResp.data;

        // Cari semua pattern API dengan argumen dinamis (menggunakan backtick)
        console.log('\n=== Pattern Endpoint Dinamis ===');
        const dynamicPatterns = js.match(/`\/api\/[^`]{2,100}`/g) || [];
        const unique = [...new Set(dynamicPatterns)];
        unique.slice(0, 30).forEach(p => console.log(p));

        // Simpan untuk analisis
        fs.writeFileSync('debug_js_endpoints_dynamic.txt', unique.join('\n'));

        // Cari khusus assigment/forum
        console.log('\n=== Pattern Assigment/Forum ===');
        const assignPattern = js.match(/assig[^"'`\s]{0,100}/gi) || [];
        const uniqueAssign = [...new Set(assignPattern)];
        uniqueAssign.slice(0, 20).forEach(p => console.log(p.substring(0, 150)));

        console.log('\n=== Pattern Forum ===');
        const forumPattern = js.match(/forum\/[^"',\s)]{0,100}/gi) || [];
        const uniqueForum = [...new Set(forumPattern)];
        uniqueForum.slice(0, 20).forEach(p => console.log(p.substring(0, 150)));

    } catch (e) {
        console.error('Error:', e.message);
    }
}

analyzeJSForEndpoints();
