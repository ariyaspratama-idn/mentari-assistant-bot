const fs = require('fs');
const path = require('path');
const { pool } = require('./lib/database');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Membagi schema menjadi statement individu
        const statements = schema.split(';').filter(s => s.trim() !== '');

        for (let statement of statements) {
            console.log(`Menjalankan: ${statement.substring(0, 50)}...`);
            await pool.execute(statement);
        }

        console.log('Database berhasil diinisialisasi!');
        process.exit(0);
    } catch (error) {
        console.error('Gagal menginisialisasi database:', error);
        process.exit(1);
    }
}

initDb();
