require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const CF = process.env.CF_CLEARANCE;
const SL = process.env.SL_SESSION;
const cookieString = `cf_clearance=${CF}; sl-session=${SL}`;

const api = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Cookie': cookieString,
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://mentari.unpam.ac.id/dashboard',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// Endpoint-endpoint umum yang biasa ada di aplikasi LMS
const endpoints = [
    '/api/user',
    '/api/me',
    '/api/profile',
    '/api/courses',
    '/api/course',
    '/api/class',
    '/api/semester',
    '/api/dashboard',
    '/api/student/courses',
    '/api/student/schedule',
    '/api/attendance/courses',
    '/api/assignment',
    '/api/assignments',
    '/api/forum',
    '/api/announcements',
];

async function probeEndpoints() {
    console.log('Mencoba endpoint API Mentari...\n');

    for (const ep of endpoints) {
        try {
            const r = await api.get(ep);
            if (r.status === 200) {
                console.log(`✅ BERHASIL: ${ep} -> Status ${r.status}`);
                const preview = JSON.stringify(r.data).substring(0, 200);
                console.log(`   Respons: ${preview}\n`);
                fs.writeFileSync(`debug_api${ep.replace(/\//g, '_')}.json`, JSON.stringify(r.data, null, 2));
            }
        } catch (e) {
            const status = e.response ? e.response.status : 'ERR';
            console.log(`❌ ${ep} -> ${status}`);
        }
    }
}

probeEndpoints();
