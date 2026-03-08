require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false // Sesuaikan jika ada file CA spesifik
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function query(sql, params) {
    const [results] = await pool.execute(sql, params);
    return results;
}

async function saveTask(task) {
    const sql = `
        INSERT INTO tasks (course_name, task_title, deadline, task_link, status)
        VALUES (?, ?, ?, ?, 'pending')
        ON DUPLICATE KEY UPDATE 
            deadline = VALUES(deadline),
            task_link = VALUES(task_link),
            status = 'pending',
            updated_at = CURRENT_TIMESTAMP
    `;
    return await query(sql, [task.course_name, task.task_title, task.deadline, task.task_link]);
}

async function markTaskAsDone(courseName, taskTitle) {
    const sql = "UPDATE tasks SET status = 'done' WHERE course_name = ? AND task_title = ?";
    return await query(sql, [courseName, taskTitle]);
}

async function taskExists(courseName, taskTitle) {
    const sql = 'SELECT id FROM tasks WHERE course_name = ? AND task_title = ?';
    const rows = await query(sql, [courseName, taskTitle]);
    return rows.length > 0;
}

async function getPendingTasks() {
    const sql = "SELECT * FROM tasks WHERE status = 'pending' ORDER BY deadline ASC";
    return await query(sql);
}

async function updateReminderStatus(taskId, type) {
    let column = type === 'h3' ? 'reminder_h3_sent' : 'reminder_h1_sent';
    const sql = `UPDATE tasks SET ${column} = TRUE WHERE id = ?`;
    return await query(sql, [taskId]);
}

async function setTaskNotified(taskId) {
    const sql = 'UPDATE tasks SET notified = TRUE WHERE id = ?';
    return await query(sql, [taskId]);
}

async function setTaskNotifiedByUnique(courseName, taskTitle) {
    const sql = 'UPDATE tasks SET notified = TRUE WHERE course_name = ? AND task_title = ?';
    return await query(sql, [courseName, taskTitle]);
}

module.exports = {
    pool,
    query,
    saveTask,
    taskExists,
    getPendingTasks,
    updateReminderStatus,
    setTaskNotified,
    setTaskNotifiedByUnique,
    markTaskAsDone
};
