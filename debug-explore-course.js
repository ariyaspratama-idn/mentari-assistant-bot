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

async function exploreUserCourse() {
    try {
        // 1. Ambil semua user-course dengan info lengkap
        const r = await api.get('/api/user-course');
        const courses = r.data.data;

        // Tampilkan semua field dari course pertama
        console.log('=== Struktur course lengkap ===');
        console.log(JSON.stringify(courses[0], null, 2));

        // Simpan semua courses
        fs.writeFileSync('debug_all_courses.json', JSON.stringify(courses, null, 2));

        // 2. Coba endpoint dengan kode_course atau shortname
        const course = courses[0];
        console.log('\n=== Info course[0] ===');
        console.log('id:', course.id);
        console.log('kode_course:', course.kode_course);
        console.log('shortname:', course.shortname);

        // Test berbagai endpoint menggunakan data nyata
        const tests = [
            `/api/course-sub-section/view?shortname=${course.shortname}`,
            `/api/course-sub-section/view?kode_course=${course.kode_course}`,
            `/api/assigment?kode_course=${course.kode_course}&limit=100`,
            `/api/assigment?shortname=${course.shortname}&limit=100`,
            `/api/forum/topic?kode_course=${course.kode_course}&limit=100`,
            `/api/forum/topic?shortname=${course.shortname}&limit=100`,
        ];

        console.log('\n=== Testing endpoints ===');
        for (const ep of tests) {
            try {
                const res = await api.get(ep);
                const isHtml = typeof res.data === 'string' && res.data.includes('<!DOCTYPE');
                if (!isHtml) {
                    console.log(`✅ ${ep.substring(0, 80)}`);
                    console.log(`   ${JSON.stringify(res.data).substring(0, 300)}\n`);
                } else {
                    console.log(`🌐 ${ep.substring(0, 80)} -> HTML (CF block)`);
                }
            } catch (e) {
                const status = e.response?.status || 'ERR';
                const isHtml = e.response && typeof e.response.data === 'string' && e.response.data.includes('<!DOCTYPE');
                console.log(`❌ ${ep.substring(0, 80)} -> ${status}${isHtml ? ' (CF)' : ''}`);
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

exploreUserCourse();
