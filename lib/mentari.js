const axios = require('axios');

let jwtToken = '';
let cfClearance = '';
let slSession = '';

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
            'Referer': 'https://mentari.unpam.ac.id/dashboard',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        }
    });
}

function setToken(jwt, cf, sl) {
    jwtToken = jwt;
    cfClearance = cf;
    slSession = sl;
}

// Verifikasi sesi dan dapatkan semester aktif
async function getActiveSemester() {
    const client = getClient();
    const r = await client.get('/api/semester');
    if (r.status === 200 && r.data.data) {
        return r.data.data.find(s => s.active) || null;
    }
    throw new Error('Tidak bisa mengambil data semester');
}

// Ambil semua mata kuliah semester ini
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

// Coba ambil konten course (sub-section, assignment, forum)
async function getCourseContent(course) {
    const client = getClient();
    const items = [];

    // Coba berbagai endpoint untuk mendapatkan tugas/forum
    const endpointVariants = [
        `/api/course-sub-section/view?shortname=${encodeURIComponent(course.shortname)}`,
        `/api/course-sub-section/view?kode_course=${encodeURIComponent(course.kode)}`,
    ];

    for (const ep of endpointVariants) {
        try {
            const r = await client.get(ep);
            if (r.status === 200 && r.data) {
                const data = Array.isArray(r.data) ? r.data : (r.data.data || []);

                data.forEach(section => {
                    // Cek apakah ada tugas atau forum
                    const subs = section.sub_sections || section.contents || section.items || [];
                    subs.forEach(sub => {
                        const isAssignment = ['assignment', 'assigment', 'tugas'].some(k =>
                            (sub.type || sub.tipe || '').toLowerCase().includes(k));
                        const isForum = (sub.type || sub.tipe || '').toLowerCase().includes('forum');

                        if (isAssignment || isForum) {
                            items.push({
                                course_name: course.nama,
                                task_title: sub.title || sub.name || sub.nama || 'Tugas',
                                deadline: sub.deadline || sub.due_date || sub.end || null,
                                task_link: `https://mentari.unpam.ac.id/course/${course.kode}`,
                                type: isAssignment ? 'assignment' : 'forum'
                            });
                        }
                    });
                });

                if (items.length > 0) break;
            }
        } catch (e) {
            // Lanjut ke endpoint berikutnya jika gagal
        }
    }

    return items;
}

module.exports = {
    setToken,
    getActiveSemester,
    getUserCourses,
    getCourseContent
};
