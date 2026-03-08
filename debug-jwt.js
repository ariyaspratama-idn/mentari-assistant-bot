require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const JWT = process.env.MENTARI_JWT;

const api = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Authorization': `Bearer ${JWT}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

async function testWithJWT() {
    console.log('=== Menguji JWT Token ===');
    console.log('JWT panjang:', JWT ? JWT.length : 'TIDAK ADA');

    // Test endpoint yang penting
    const endpoints = [
        '/api/course',
        '/api/semester',
        '/api/user-course',
        '/api/mata-kuliah',
        '/api/mahasiswa',
    ];

    for (const ep of endpoints) {
        try {
            const r = await api.get(ep);
            console.log(`\n✅ ${ep} -> ${r.status}`);
            const preview = JSON.stringify(r.data).substring(0, 400);
            console.log(`Data: ${preview}`);
            fs.writeFileSync(`debug_jwt${ep.replace(/\//g, '_')}.json`, JSON.stringify(r.data, null, 2));
        } catch (e) {
            const status = e.response ? e.response.status : 'ERR';
            const msg = e.response ? JSON.stringify(e.response.data).substring(0, 100) : e.message;
            console.log(`❌ ${ep} -> ${status}: ${msg}`);
        }
    }
}

testWithJWT();
