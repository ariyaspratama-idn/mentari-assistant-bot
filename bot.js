require('dotenv').config();
const mentari = require('./lib/mentari');
const db = require('./lib/database');
const telegram = require('./lib/telegram');
const { checkTokenExpiry } = require('./lib/token-check');
const dayjs = require('dayjs');

// Konfigurasi token dari env
mentari.setToken(
    process.env.MENTARI_JWT,
    process.env.CF_CLEARANCE,
    process.env.SL_SESSION
);

async function runBot() {
    console.log(`\n[${new Date().toISOString()}] 🤖 Menjalankan siklus bot...`);

    try {
        // 0. Cek masa berlaku JWT token (H-7 dan H-1 notifikasi)
        await checkTokenExpiry(process.env.MENTARI_JWT, telegram.sendTelegramMessage);

        // 1. Cek semester aktif
        const semester = await mentari.getActiveSemester();
        if (!semester) {
            console.log('Tidak ada semester aktif.');
            return;
        }
        console.log(`📅 Semester aktif: ${semester.nama_semester}`);

        // 2. Ambil daftar mata kuliah
        const courses = await mentari.getUserCourses();
        console.log(`📚 Mata kuliah: ${courses.length}`);

        // 3. Ambil tugas/forum dari setiap mata kuliah
        const allItems = [];
        for (const course of courses) {
            const items = await mentari.getCourseContent(course);
            allItems.push(...items);
        }
        console.log(`📋 Total tugas/forum: ${allItems.length}`);

        // 4. Simpan yang baru ke DB dan kirim notifikasi
        let newCount = 0;
        for (const item of allItems) {
            try {
                const exists = await db.taskExists(item.course_name, item.task_title);
                if (!exists) {
                    await db.saveTask(item);
                    await telegram.sendTelegramMessage(formatNewTaskMessage(item));
                    newCount++;
                }
            } catch (e) {
                console.error(`Error simpan "${item.task_title}":`, e.message);
            }
        }

        if (newCount > 0) {
            console.log(`🔔 ${newCount} notifikasi terkirim`);
        } else {
            console.log('Tidak ada tugas/forum baru.');
        }

        // 5. Cek pengingat deadline H-3 dan H-1
        try {
            const pendingTasks = await db.getPendingTasks();
            for (const task of pendingTasks) {
                if (!task.deadline) continue;
                const hoursLeft = dayjs(task.deadline).diff(dayjs(), 'hour');

                if (hoursLeft >= 71 && hoursLeft <= 73 && !task.reminder_h3_sent) {
                    await telegram.sendTelegramMessage(formatReminderMessage(task, 3));
                    await db.updateReminderStatus(task.id, 'h3');
                }
                if (hoursLeft >= 23 && hoursLeft <= 25 && !task.reminder_h1_sent) {
                    await telegram.sendTelegramMessage(formatReminderMessage(task, 1));
                    await db.updateReminderStatus(task.id, 'h1');
                }
            }
        } catch (e) {
            console.error('Error cek reminder:', e.message);
        }

        console.log('✅ Siklus selesai.');

    } catch (e) {
        console.error('Bot Error:', e.message);
        try {
            await telegram.sendTelegramMessage(`❌ <b>Bot Error:</b>\n${e.message}`);
        } catch (_) { }
    }
}

function formatNewTaskMessage(item) {
    const icon = item.type === 'forum' ? '💬' : '📝';
    const label = item.type === 'forum' ? 'Forum Diskusi Baru' : 'Tugas Baru';
    let msg = `${icon} <b>${label}!</b>\n\n`;
    msg += `📚 <b>Mata Kuliah:</b> ${item.course_name}\n`;
    msg += `📌 <b>Judul:</b> ${item.task_title}\n`;
    if (item.deadline) {
        msg += `⏰ <b>Deadline:</b> ${dayjs(item.deadline).format('DD MMM YYYY HH:mm')}\n`;
    } else {
        msg += `⏰ <b>Deadline:</b> Cek di Mentari\n`;
    }
    msg += `🔗 <a href="${item.task_link}">Buka di Mentari</a>`;
    return msg;
}

function formatReminderMessage(task, hari) {
    const icon = hari === 1 ? '🚨' : '⚠️';
    const label = hari === 1 ? 'H-1 KRITIS!' : 'H-3 Pengingat';
    let msg = `${icon} <b>${label}</b>\n\n`;
    msg += `📚 <b>Mata Kuliah:</b> ${task.course_name}\n`;
    msg += `📌 <b>Tugas:</b> ${task.task_title}\n`;
    if (task.deadline) {
        msg += `⏰ <b>Deadline:</b> ${dayjs(task.deadline).format('DD MMM YYYY HH:mm')}\n`;
        msg += `⌛ <b>Sisa:</b> ±${hari} hari!\n`;
    }
    msg += `🔗 <a href="${task.task_link}">Kerjakan sekarang!</a>`;
    return msg;
}

if (require.main === module) {
    runBot().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runBot };
