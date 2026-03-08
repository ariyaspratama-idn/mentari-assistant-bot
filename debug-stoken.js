require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const CF = process.env.CF_CLEARANCE;
const SL = process.env.SL_SESSION;
const STOKEN = process.env.STOKEN;

const cookieString = `cf_clearance=${CF}; sl-session=${SL}; stoken=${STOKEN}`;

const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://mentari.unpam.ac.id/dashboard',
    'Origin': 'https://mentari.unpam.ac.id',
    'Cookie': cookieString,
    'Authorization': `Bearer ${STOKEN}`
};

const client = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
    headers: baseHeaders
});

async function testEndpoints() {
    console.log('=== Menguji stoken sebagai Bearer Token ===\n');

    const tests = [
        { method: 'GET', path: '/api/course' },
        { method: 'GET', path: '/api/semester' },
        { method: 'GET', path: '/api/user-course' },
        { method: 'GET', path: '/api/assigment' },
        { method: 'GET', path: '/api/forum/topic' },
        { method: 'GET', path: '/api/presensi' },
    ];

    for (const t of tests) {
        try {
            const r = await client[t.method.toLowerCase()](t.path);
            console.log(`✅ ${t.path} -> ${r.status}`);
            const preview = JSON.stringify(r.data).substring(0, 400);
            console.log(`   Data: ${preview}\n`);
            fs.writeFileSync(`debug_stoken${t.path.replace(/\//g, '_')}.json`, JSON.stringify(r.data, null, 2));
        } catch (e) {
            const status = e.response ? e.response.status : 'ERR';
            const msg = e.response ? JSON.stringify(e.response.data).substring(0, 150) : e.message;
            console.log(`❌ ${t.path} -> ${status}: ${msg}`);
        }
    }
}

testEndpoints();
