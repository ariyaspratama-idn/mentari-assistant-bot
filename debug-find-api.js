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
        'Referer': 'https://mentari.unpam.ac.id/dashboard'
    }
});

async function main() {
    // 1. Coba endpoint yang tadi return 401 dengan variasi auth
    console.log('=== Mencoba endpoint yang return 401 ===');

    const endpoints401 = [
        '/api/course',
        '/api/semester',
        '/api/course/list',
        '/api/semester/active',
        '/api/semester/current',
        '/api/schedule',
        '/api/student',
        '/api/auth/user',
        '/api/auth/me',
        '/api/v1/course',
        '/api/v1/user',
        '/api/v1/auth/me',
    ];

    for (const ep of endpoints401) {
        try {
            const r = await client.get(ep);
            if (r.status === 200) {
                const preview = JSON.stringify(r.data).substring(0, 300);
                console.log(`✅ BERHASIL: ${ep}`);
                console.log(`   Data: ${preview}\n`);
                fs.writeFileSync(`debug_found${ep.replace(/\//g, '_')}.json`, JSON.stringify(r.data, null, 2));
            }
        } catch (e) {
            const status = e.response ? e.response.status : 'ERR';
            if (status === 200) {
                console.log(`✅ OK: ${ep}`);
            } else {
                console.log(`❌ ${ep} -> ${status}`);
            }
        }
    }

    // 2. Ambil file JS utama Mentari dan cari endpoint API
    console.log('\n=== Analisis File JS Mentari ===');
    try {
        const homePage = await client.get('/');
        const jsMatch = homePage.data.match(/src="(\/assets\/index-[^"]+\.js)"/);

        if (jsMatch) {
            const jsUrl = jsMatch[1];
            console.log(`File JS utama ditemukan: ${jsUrl}`);

            const jsResp = await client.get(jsUrl);
            const jsContent = jsResp.data;

            // Cari semua pola /api/ dalam kode JS
            const apiMatches = jsContent.match(/"\/api\/[^"]{2,50}"/g);
            if (apiMatches) {
                const unique = [...new Set(apiMatches)];
                console.log('\nEndpoint API yang ditemukan dalam JS:');
                unique.forEach(ep => console.log(' -', ep));

                // Simpan daftar endpoint
                fs.writeFileSync('debug_endpoints_found.txt', unique.join('\n'));
            }

            // Cari pola autentikasi
            const authMatch = jsContent.match(/Authorization[^;]{0,100}/g);
            if (authMatch) {
                console.log('\nPola autentikasi dalam JS:');
                authMatch.slice(0, 5).forEach(m => console.log(' -', m.substring(0, 120)));
            }
        } else {
            console.log('File JS utama tidak ditemukan dari halaman utama.');
            // Ambil petunjuk dari HTML
            const scriptTags = homePage.data.match(/src="\/assets\/[^"]+"/g);
            console.log('Script tags yang ada:', scriptTags);
        }
    } catch (e) {
        console.error('Gagal analisis JS:', e.message);
    }
}

main();
