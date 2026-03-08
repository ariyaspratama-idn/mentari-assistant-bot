require('dotenv').config();
const mentari = require('./lib/mentari');
const fs = require('fs');

async function fullTest() {
    console.log('=== UJI PENUH MENTARI BOT ===\n');

    // Setup token
    mentari.setToken(
        process.env.MENTARI_JWT,
        process.env.CF_CLEARANCE,
        process.env.SL_SESSION
    );

    // 1. Verifikasi sesi
    const semesterId = await mentari.verifySession();
    console.log('Semester ID aktif:', semesterId);

    // 2. Ambil daftar mata kuliah
    const courses = await mentari.getUserCourses(semesterId);
    console.log(`\nMata kuliah ditemukan: ${courses.length}`);
    courses.forEach(c => console.log(`  - ${c.nama} (${c.kelas})`));

    fs.writeFileSync('debug_courses_full.json', JSON.stringify(courses, null, 2));

    // 3. Coba ambil tugas dari tiap mata kuliah
    console.log('\n=== Mencari Tugas dan Forum ===');
    const allTasks = [];

    for (const course of courses.slice(0, 3)) { // Test 3 mata kuliah pertama
        console.log(`\nScanning: ${course.nama}...`);

        const assignments = await mentari.getAssignments(course.id, course.nama);
        console.log(`  Tugas: ${assignments.length}`);
        allTasks.push(...assignments);

        const forums = await mentari.getForumTopics(course.id, course.nama);
        console.log(`  Forum: ${forums.length}`);
        allTasks.push(...forums);
    }

    console.log(`\nTotal tugas/forum ditemukan: ${allTasks.length}`);
    if (allTasks.length > 0) {
        fs.writeFileSync('debug_tasks_full.json', JSON.stringify(allTasks, null, 2));
        console.log('Data disimpan ke debug_tasks_full.json');
    }
}

fullTest().catch(console.error);
