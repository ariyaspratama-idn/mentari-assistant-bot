let stoken = '';

function setToken(jwt, cf, sl, st) {
    jwtToken = jwt;
    cfClearance = cf;
    slSession = sl;
    stoken = st;
}

// Helper untuk generate headers anti-Cloudflare standar (Mirroring Chrome 145 Boss)
function getHeaders(kodeCourse = '') {
    const referer = kodeCourse ? `https://mentari.unpam.ac.id/course/${kodeCourse}` : 'https://mentari.unpam.ac.id/dashboard';
    return {
        'Accept': '*/*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Authorization': `Bearer ${jwtToken}`,
        'Cookie': `sl-session=${slSession}; stoken=${stoken}; cf_clearance=${cfClearance}`,
        'Priority': 'u=1, i',
        'Referer': referer,
        'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
    };
}

async function getActiveSemester() {
    const url = 'https://mentari.unpam.ac.id/api/semester';
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const text = await response.text();
        const json = JSON.parse(text);
        if (json.data) {
            return json.data.find(s => s.active) || null;
        }
    } catch (e) {
        throw new Error(`Tidak bisa mengambil data semester: ${e.message}`);
    }
    return null;
}

async function getUserCourses() {
    const url = 'https://mentari.unpam.ac.id/api/user-course';
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const text = await response.text();
        const json = JSON.parse(text);
        if (json.data) {
            return json.data.map(c => ({
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
    } catch (e) {
        throw new Error(`Gagal mengambil data mata kuliah: ${e.message}`);
    }
    return [];
}

async function getCourseContent(course) {
    const url = `https://mentari.unpam.ac.id/api/user-course/${course.kode}`;
    const items = [];
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(course.kode)
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

                    // EKSTRA FILTER: Hanya kirim yang BELUM dikerjakan
                    // Di Mentari, jika sudah submit/replay, completion / haveAction akan true
                    if (sub.completion === true || sub.haveAction === true) return;

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
