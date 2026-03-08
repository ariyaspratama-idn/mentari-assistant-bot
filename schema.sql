-- Tabel untuk menyimpan informasi tugas dan ujian
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    task_title VARCHAR(255) NOT NULL,
    deadline DATETIME NULL,
    task_link TEXT,
    notified BOOLEAN DEFAULT FALSE,
    reminder_h3_sent BOOLEAN DEFAULT FALSE,
    reminder_h1_sent BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, done, overdue
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_task (course_name, task_title)
);

-- Tabel untuk log aktivitas (opsional untuk audit/debugging)
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
