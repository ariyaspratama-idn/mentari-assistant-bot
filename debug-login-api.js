require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const CF = process.env.CF_CLEARANCE;
const SL = process.env.SL_SESSION;
const cookieString = `cf_clearance=${CF}; sl-session=${SL}`;

const client = axios.create({
    baseURL: 'https://mentari.unpam.ac.id',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Cookie': cookieString,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Referer': 'https://mentari.unpam.ac.id/login',
        'Origin': 'https://mentari.unpam.ac.id'
    }
});

const NIM = process.env.MENTARI_NIM;
const PASSWORD = process.env.MENTARI_PASSWORD;

async function tryLogin() {
    console.log(`Mencoba login dengan NIM: ${NIM}`);

    // Variasi payload login yang mungkin digunakan
    const payloads = [
        { username: NIM, password: PASSWORD },
        { nim: NIM, password: PASSWORD },
        { user: NIM, password: PASSWORD },
        { email: NIM, password: PASSWORD },
        { identifier: NIM, password: PASSWORD },
    ];

    for (const payload of payloads) {
        try {
            console.log(`\nMencoba /api/login dengan payload: ${JSON.stringify(Object.keys(payload))}`);
            const r = await client.post('/api/login', payload);

            console.log(`✅ SUKSES! Status: ${r.status}`);
            console.log('Respons:', JSON.stringify(r.data).substring(0, 500));
            fs.writeFileSync('debug_login_success.json', JSON.stringify(r.data, null, 2));

            // Simpan token jika ada
            if (r.data.token || r.data.access_token) {
                const token = r.data.token || r.data.access_token;
                console.log('\n🔑 Token JWT ditemukan! Panjang:', token.length);

                // Test akses endpoint dengan token
                await testWithToken(token);
            }
            return r.data;
        } catch (e) {
            const status = e.response ? e.response.status : 'ERROR';
            const msg = e.response ? JSON.stringify(e.response.data).substring(0, 100) : e.message;
            console.log(`❌ Gagal (${status}): ${msg}`);
        }
    }

    // Coba juga SSO login
    console.log('\n\nMencoba /api/loginsso...');
    try {
        const r = await client.post('/api/loginsso', { username: NIM, password: PASSWORD });
        console.log(`✅ SSO SUKSES! Status: ${r.status}`);
        console.log('Respons:', JSON.stringify(r.data).substring(0, 500));
        fs.writeFileSync('debug_sso_success.json', JSON.stringify(r.data, null, 2));
    } catch (e) {
        const status = e.response ? e.response.status : 'ERROR';
        const msg = e.response ? JSON.stringify(e.response.data).substring(0, 200) : e.message;
        console.log(`❌ SSO Gagal (${status}): ${msg}`);
    }
}

async function testWithToken(token) {
    const authClient = axios.create({
        baseURL: 'https://mentari.unpam.ac.id',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': cookieString,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        }
    });

    console.log('\nMengakses /api/course dengan token...');
    try {
        const r = await authClient.get('/api/course');
        console.log('✅ Berhasil!');
        console.log(JSON.stringify(r.data).substring(0, 500));
        fs.writeFileSync('debug_courses.json', JSON.stringify(r.data, null, 2));
    } catch (e) {
        console.log('❌ Gagal:', e.response ? e.response.status : e.message);
    }
}

tryLogin();
