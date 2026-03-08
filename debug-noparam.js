require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const JWT = process.env.MENTARI_JWT;
const CF = process.env.CF_CLEARANCE;
const SL = process.env.SL_SESSION;

const api = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
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

async function test() {
    console.log('=== Menguji Endpoint Tanpa Parameter ===\n');

    // Yang berhasil sebelumnya menggunakan /api/semester dan /api/user-course TANPA parameter
    // Coba pattern serupa:
    const tests = [
        '/api/user-course',                      // berhasil -> gunakan untuk list course IDs
        '/api/user-course?semester=20252',       // variasi
        '/api/assigment',                        // tanpa parameter
        '/api/forum/topic',                      // tanpa parameter
        '/api/course-sub-section/view',          // tanpa parameter
        '/api/presensi',                         // tanpa parameter
    ];

    for (const ep of tests) {
        try {
            const r = await api.get(ep);
            const isHtml = typeof r.data === 'string' && r.data.includes('<!DOCTYPE');
            if (!isHtml) {
                console.log(`✅ ${ep} -> ${r.status}`);
                const preview = JSON.stringify(r.data).substring(0, 500);
                console.log(`   ${preview}\n`);
                fs.writeFileSync(`debug_noparam${ep.replace(/[/?=&]/g, '_')}.json`,
                    JSON.stringify(r.data, null, 2));
            } else {
                console.log(`✅ ${ep} -> ${r.status} (HTML response)`);
            }
        } catch (e) {
            const status = e.response ? e.response.status : 'ERR';
            const isHtml = e.response && typeof e.response.data === 'string' && e.response.data.includes('<!DOCTYPE');
            console.log(`❌ ${ep} -> ${status}${isHtml ? ' (CF/HTML block)' : ': ' + JSON.stringify(e.response?.data || e.message).substring(0, 80)}`);
        }
    }
}

test().catch(console.error);
