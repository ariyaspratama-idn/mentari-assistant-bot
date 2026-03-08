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
        'Referer': 'https://mentari.unpam.ac.id/dashboard',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
    }
});

// Course ID dari debug sebelumnya
const COURSE_ID = '0d35ff5e-95fa-44f0-8696-838621c70a76';
const KODE_COURSE = '20252-06TPLE013-22TIF0323';

async function findCourseEndpoints() {
    console.log('=== Mencari Endpoint Course, Assignment & Forum ===\n');

    const tests = [
        `/api/course/${COURSE_ID}`,
        `/api/course?id=${COURSE_ID}`,
        `/api/course?kode=${KODE_COURSE}`,
        `/api/assigment?course_id=${COURSE_ID}`,
        `/api/assigment?kode_course=${KODE_COURSE}`,
        `/api/assigment/${COURSE_ID}`,
        `/api/forum/topic?course_id=${COURSE_ID}`,
        `/api/forum/topic?kode_course=${KODE_COURSE}`,
        `/api/course-sub-section/view?course_id=${COURSE_ID}`,
        `/api/course-sub-section/view?kode=${KODE_COURSE}`,
        `/api/presensi?course_id=${COURSE_ID}`,
    ];

    for (const ep of tests) {
        try {
            const r = await api.get(ep);
            const isHtml = typeof r.data === 'string' && r.data.includes('<!DOCTYPE');
            if (!isHtml) {
                console.log(`✅ ${ep} -> ${r.status}`);
                const preview = JSON.stringify(r.data).substring(0, 300);
                console.log(`   ${preview}\n`);
                fs.writeFileSync(`debug_ep${ep.replace(/[/?=&]/g, '_').substring(0, 50)}.json`,
                    JSON.stringify(r.data, null, 2));
            } else {
                console.log(`✅ ${ep} -> ${r.status} (HTML - kemungkinan UI route, bukan API)`);
            }
        } catch (e) {
            const status = e.response ? e.response.status : 'ERR';
            const isHtml = e.response && typeof e.response.data === 'string' && e.response.data.includes('<!DOCTYPE');
            console.log(`❌ ${ep} -> ${status}${isHtml ? ' (CF block)' : ''}`);
        }
    }
}

findCourseEndpoints().catch(console.error);
