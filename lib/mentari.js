const axios = require('axios'); // Masih dipakai untuk getUserCourses & semester yang tidak diblokir ketat

let jwtToken = '';
let cfClearance = '';
let slSession = '';

function setToken(jwt, cf, sl) {
    jwtToken = jwt;
    cfClearance = cf;
    slSession = sl;
}

function getClient() {
    return axios.create({
        baseURL: 'https://mentari.unpam.ac.id',
        timeout: 20000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Authorization': `Bearer ${jwtToken}`,
            'Cookie': `cf_clearance=${cfClearance}; sl-session=${slSession}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Referer': 'https://mentari.unpam.ac.id/dashboard'
        }
    });
}

async function getActiveSemester() {
    const client = getClient();
    const r = await client.get('/api/semester');
    if (r.status === 200 && r.data.data) {
        return r.data.data.find(s => s.active) || null;
    }
    throw new Error('Tidak bisa mengambil data semester');
}

async function getUserCourses() {
    const client = getClient();
    const r = await client.get('/api/user-course');
    if (r.status === 200 && r.data.data) {
        return r.data.data.map(c => ({
            id: c.id,
            kode: c.kode_course,
            shortname: c.shortname,
            nama: c.nama_mata_kuliah,
            kelas: c.id_kelas,
            hari: c.nama_hari,
            sks: c.sks,
            dosen: c.nama_dosen || 'N/A',
            semester: c.id_semester_registrasi
        }));
    }
    return [];
}

// Fetch khusus course detail menggunakan header super lengkap untuk bypass CF WAF
async function getCourseContent(course) {
    const url = `https://mentari.unpam.ac.id/api/user-course/${course.kode}`;

    const items = [];
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9,id;q=0.8',
                'authorization': `Bearer ${jwtToken}`,
                'cookie': `cf_clearance=${cfClearance}; sl-session=${slSession}`,
                'priority': 'u=1, i',
                'referer': `https://mentari.unpam.ac.id/course/${course.kode}`,
                'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) return items; // Jika diblokir atau 404

        const text = await response.text();
        if (text.includes('<!DOCTYPE')) return items; // HTML Cloudflare page

        const json = JSON.parse(text);
        const data = Array.isArray(json) ? json : (json.data || []);

        data.forEach(chapter => {
            const listSub = chapter.sub_section || [];
            listSub.forEach(sub => {
                if (!sub || !sub.tipe) return;

                const type = sub.tipe.toUpperCase();

                if (type === 'ASSIGNMENT' || type === 'FORUM') {
                    if (sub.warningAlert) return; // Belum tersedia/belum dibuka dosen

                    // Filter tugas & forum kosong (placeholder awal semester)
                    const isReal = (sub.id !== null) || (sub.konten && sub.konten.trim() !== '') || (sub.file !== null) || (sub.link !== null);
                    if (!isReal) return;

                    items.push({
                        course_name: course.nama,
                        task_title: sub.judul || (type === 'FORUM' ? 'Forum Diskusi' : 'Tugas Mandiri'),
                        deadline: sub.end_date || null,
                        task_link: `https://mentari.unpam.ac.id/course/${course.kode}`,
                        type: type === 'FORUM' ? 'forum' : 'assignment',
                        section_name: chapter.nama_pertemuan || chapter.nama_section || 'Pertemuan'
                    });
                }
            });
        });

    } catch (e) {
        console.error(`Gagal ekstrak course ${course.kode}: ${e.message}`);
    }

    return items;
}

module.exports = {
    setToken,
    getActiveSemester,
    getUserCourses,
    getCourseContent
};
