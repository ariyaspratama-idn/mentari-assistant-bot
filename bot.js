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
    // Gunakan waktu lokal dari metadata: 2026-03-08T19:53:55+07:00
    // Namun untuk server (GitHub/Vercel), kita gunakan UTC.
    // 19:00 WIB = 12:00 UTC
    // 22:00 WIB = 15:00 UTC
    const nowUtc = dayjs().utc();
    const nowWibHour = nowUtc.add(7, 'hour').hour();
    const isScheduledReport = nowWibHour === 19 || nowWibHour === 22;

    console.log(`\n[${nowUtc.toISOString()}] 🤖 Menjalankan siklus bot (WIB Hour: ${nowWibHour})...`);

    try {
        // 0. Cek masa berlaku JWT token
        await checkTokenExpiry(process.env.MENTARI_JWT, telegram.sendTelegramMessage);

        // 0.b Set token ke lib
        mentari.setToken(
            process.env.MENTARI_JWT,
            process.env.CF_CLEARANCE,
            process.env.SL_SESSION,
            process.env.STOKEN
        );

        // 1. Ambil daftar mata kuliah
        const courses = await mentari.getUserCourses();
        if (!courses || courses.length === 0) {
            console.log('Tidak ada mata kuliah ditemukan.');
            return;
        }

        // 2. Ambil tugas/forum AKTIF (belum dikerjakan) dari Mentari
        const activeItemsFromMentari = [];
        for (const course of courses) {
            try {
                const items = await mentari.getCourseContent(course);
                activeItemsFromMentari.push(...items);
            } catch (e) {
                console.error(`Gagal ambil konten ${course.nama}:`, e.message);
            }
        }

        // 3. Sinkronisasi Database
        // Ambil semua tugas 'pending' dari DB
        const pendingInDb = await db.getPendingTasks();

        // Cari tugas yang ada di DB tapi TIDAK ada di Mentari (artinya sudah dikerjakan/dihapus)
        for (const dbTask of pendingInDb) {
            const foundInMentari = activeItemsFromMentari.some(m =>
                m.course_name === dbTask.course_name && m.task_title === dbTask.task_title
            );

            if (!foundInMentari) {
                console.log(`✅ Tugas selesai: ${dbTask.task_title}`);
                await db.markTaskAsDone(dbTask.course_name, dbTask.task_title);
            }
        }

        // 4. Deteksi Tugas BARU
        let newCount = 0;
        for (const item of activeItemsFromMentari) {
            const alreadyNotified = await db.taskExists(item.course_name, item.task_title);
            if (!alreadyNotified) {
                await db.saveTask(item);
                await telegram.sendTelegramMessage(formatNewTaskMessage(item));
                await db.setTaskNotifiedByUnique(item.course_name, item.task_title);
                newCount++;
            } else {
                // Pastikan data terbaru tersimpan (update deadline jika berubah)
                await db.saveTask(item);
            }
        }

        // 5. LAPORAN RUTIN (19:00 & 22:00 WIB)
        if (isScheduledReport) {
            console.log('📢 Mengirim laporan rutin terjadwal...');
            const finalPending = await db.getPendingTasks();
            await telegram.sendTelegramMessage(formatScheduledReportMessage(finalPending, nowWibHour));
        }

        // 6. PENGINGAT DEADLINE (H-3 dan H-1)
        const tasksForReminder = await db.getPendingTasks();
        for (const task of tasksForReminder) {
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

        console.log(`✅ Siklus selesai. Baru: ${newCount}, Terjadwal: ${isScheduledReport}`);

    } catch (e) {
        console.error('Bot Error:', e.message);
        const source = process.env.GITHUB_ACTIONS ? 'GITHUB' : (process.env.VERCEL ? 'VERCEL' : 'LOKAL');

        // JANGAN kirim error 403 ke Telegram jika dari cloud, biar nggak berisik
        if (source !== 'LOKAL' && e.message.includes('403')) return;

        await telegram.sendTelegramMessage(`❌ [${source}] <b>Bot Error:</b>\n${e.message}`).catch(() => { });
    }
}

function formatNewTaskMessage(item) {
    const source = process.env.GITHUB_ACTIONS ? 'GITHUB' : (process.env.VERCEL ? 'VERCEL' : 'LOKAL');
    const icon = item.type === 'forum' ? '💬' : '📝';
    const label = item.type === 'forum' ? 'FORUM BARU' : 'TUGAS BARU';
    let msg = `[${source}] ${icon} <b>${label}!</b>\n\n`;
    msg += `📚 <b>${item.course_name}</b>\n`;
    msg += `📌 ${item.task_title}\n`;
    msg += `⏰ DL: ${item.deadline ? dayjs(item.deadline).format('DD/MM HH:mm') : 'Cek Mentari'}\n`;
    msg += `📍 ${item.section_name}\n\n`;
    msg += `🔗 <a href="${item.task_link}">Buka Mentari</a>`;
    return msg;
}

function formatScheduledReportMessage(tasks, hour) {
    const source = process.env.GITHUB_ACTIONS ? 'GITHUB' : (process.env.VERCEL ? 'VERCEL' : 'LOKAL');
    let msg = `[${source}] 📊 <b>LAPORAN RUTIN (${hour}:00 WIB)</b>\n\n`;

    if (tasks.length === 0) {
        msg += `✅ Luar biasa! Semua tugas dan forum sudah Anda kerjakan. Tidak ada tanggungan untuk saat ini. ☕`;
    } else {
        msg += `Bapak/Ibu, berikut daftar tugas & forum yang <b>BELUM dikerjakan</b>:\n\n`;

        // Kelompokkan per matkul
        const grouped = {};
        tasks.forEach(t => {
            if (!grouped[t.course_name]) grouped[t.course_name] = [];
            grouped[t.course_name].push(t);
        });

        for (const [course, items] of Object.entries(grouped)) {
            msg += `📚 <b>${course}</b>\n`;
            items.forEach(it => {
                const icon = it.task_title.toLowerCase().includes('forum') ? '💬' : '📝';
                msg += `  ${icon} ${it.task_title}\n`;
                if (it.deadline) msg += `     ⏰ DL: ${dayjs(it.deadline).format('DD/MM HH:mm')}\n`;
            });
            msg += '\n';
        }
        msg += `💪 Semangat mengerjakannya!`;
    }
    return msg;
}

function formatReminderMessage(task, hari) {
    const icon = hari === 1 ? '🚨' : '⚠️';
    const label = hari === 1 ? 'DEADLINE BESOK!' : 'PENGINGAT H-3';
    let msg = `${icon} <b>${label}</b>\n\n`;
    msg += `📚 <b>${task.course_name}</b>\n`;
    msg += `📌 ${task.task_title}\n`;
    msg += `⏰ DL: ${dayjs(task.deadline).format('DD MMM, HH:mm')}\n`;
    msg += `⌛ Sisa waktu: ±${hari} hari lagi!\n\n`;
    msg += `🔗 <a href="${task.task_link}">Kerjakan Sekarang</a>`;
    return msg;
}

const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

if (require.main === module) {
    runBot().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runBot };
