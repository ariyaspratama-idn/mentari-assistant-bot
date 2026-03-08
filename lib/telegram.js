const axios = require('axios');
require('dotenv').config();

async function sendTelegramMessage(message) {
    const token = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!token || !chatId) {
        console.error('Bot Token atau Chat ID tidak dikonfigurasi!');
        return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML' // Menggunakan HTML untuk kemudahan formatting
        });
        console.log('Notifikasi Telegram terkirim!');
    } catch (error) {
        console.error('Gagal mengirim ke Telegram:', error.response ? error.response.data : error.message);
    }
}

function formatNewTaskMessage(task) {
    return `
<b>🔔 TUGAS BARU TERDETEKSI!</b>

📚 <b>Mata Kuliah:</b> ${task.course_name}
📝 <b>Tugas:</b> ${task.task_title}
⏰ <b>Deadline:</b> ${task.deadline}

🔗 <a href="${task.task_link}">Buka di Mentari</a>

<i>Segera login ke Mentari untuk mengerjakan!</i>
`;
}

function formatReminderMessage(task, type) {
    const prefix = type === 'h3' ? '⚠️ <b>PENGINGAT H-3</b>' : '🚨 <b>PENGINGAT H-1/DEALINE</b>';
    return `
${prefix}

📚 <b>${task.course_name}</b>
📝 ${task.task_title}
⏰ <b>Deadline:</b> ${task.deadline}

<i>Ayo dikerjakan, jangan sampai lewat deadline!</i>
`;
}

module.exports = {
    sendTelegramMessage,
    formatNewTaskMessage,
    formatReminderMessage
};
