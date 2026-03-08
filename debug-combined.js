require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const JWT = process.env.MENTARI_JWT;
const CF = process.env.CF_CLEARANCE;
const SL = process.env.SL_SESSION;

// Kombinasi JWT + seluruh cookie Cloudflare
const cookieString = `cf_clearance=${CF}; sl-session=${SL}`;

const api = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Authorization': `Bearer ${JWT}`,
        'Cookie': cookieString,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Referer': 'https://mentari.unpam.ac.id/dashboard',
        'Origin': 'https://mentari.unpam.ac.id',
        // Header tambahan yang biasa dikirim browser
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest'
    }
});

async function testCombined() {
    console.log('=== JWT + Cookie Cloudflare ===\n');

    const endpoints = [
        '/api/course',
        '/api/semester',
        '/api/user-course',
    ];

    for (const ep of endpoints) {
        try {
            const r = await api.get(ep);
            console.log(`✅ ${ep} -> ${r.status}`);
            const data = JSON.stringify(r.data);
            console.log(`Data: ${data.substring(0, 500)}\n`);
            fs.writeFileSync(`debug_combined${ep.replace(/\//g, '_')}.json`, JSON.stringify(r.data, null, 2));
        } catch (e) {
            const status = e.response ? e.response.status : 'ERR';
            const isHtml = e.response && typeof e.response.data === 'string' && e.response.data.includes('<!DOCTYPE');
            console.log(`❌ ${ep} -> ${status} ${isHtml ? '(Cloudflare HTML)' : JSON.stringify(e.response?.data || e.message).substring(0, 100)}`);
        }
    }
}

testCombined();
