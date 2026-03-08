const dayjs = require('dayjs');
const { getPendingTasks } = require('./database');

async function analyzePriorities() {
    const tasks = await getPendingTasks();
    if (tasks.length === 0) return { list: [], message: 'Semua tugas sudah selesai atau tidak ada tugas aktif! 🎉' };

    const priorityList = tasks.map(task => {
        const deadline = dayjs(task.deadline);
        const hoursLeft = deadline.diff(dayjs(), 'hour');

        let score = 0;
        if (hoursLeft < 24) score += 100; // Super mendesak
        else if (hoursLeft < 72) score += 70; // H-3
        else if (hoursLeft < 168) score += 40; // H-7
        else score += 10;

        // Tambah poin jika tugas sudah lama dibuat tapi belum dikerjakan
        const age = dayjs().diff(dayjs(task.created_at), 'day');
        score += age * 5;

        return { ...task, score, hoursLeft };
    });

    // Urutkan berdasarkan skor tertinggi
    priorityList.sort((a, b) => b.score - a.score);

    // Deteksi jika tugas menumpuk (lebih dari 3 per matkul)
    const courseLoad = {};
    priorityList.forEach(t => {
        courseLoad[t.course_name] = (courseLoad[t.course_name] || 0) + 1;
    });

    const overloadedCourses = Object.keys(courseLoad).filter(c => courseLoad[c] >= 3);

    let summary = '📊 <b>ANALISIS PRIORITAS TUGAS</b>\n\n';
    priorityList.slice(0, 5).forEach((t, i) => {
        summary += `${i + 1}. <b>${t.course_name}</b> - ${t.task_title}\n   <i>Sisa: ${Math.floor(t.hoursLeft / 24)} hari ${t.hoursLeft % 24} jam</i>\n\n`;
    });

    if (overloadedCourses.length > 0) {
        summary += '⚠️ <b>PERINGATAN TUGAS MENUMPUK!</b>\n';
        overloadedCourses.forEach(c => {
            summary += `- ${c} (${courseLoad[c]} tugas aktif)\n`;
        });
    }

    return { list: priorityList, message: summary };
}

module.exports = {
    analyzePriorities
};
