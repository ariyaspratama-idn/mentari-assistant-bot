const fs = require('fs');
const { execSync } = require('child_process');

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');
const envList = ['production', 'preview', 'development'];

for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const splitIdx = line.indexOf('=');
    if (splitIdx === -1) continue;

    const key = line.substring(0, splitIdx).trim();
    let val = line.substring(splitIdx + 1).trim();

    // Hapus kutip jika ada
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
    }

    console.log(`\n----- Update: ${key} -----`);

    // Tulis val murni ke file untuk piper
    fs.writeFileSync('.temp_env_val.txt', val, { encoding: 'utf-8' });

    for (const env of envList) {
        // Hapus variabel lama SETIAP env secara individual (Vercel CLI terbaru butuh satu persatu)
        try {
            execSync(`vercel env rm ${key} ${env} -y`, { stdio: 'ignore', shell: true });
        } catch (e) { }

        // Tambah variabel baru dengan pipe dari file sementara murni (.txt tanpa tanda petik yang rusak)
        try {
            execSync(`vercel env add ${key} ${env} < .temp_env_val.txt`, { stdio: 'ignore', shell: true });
            console.log(`✅ Sukses (Pipes OK) -> ${env}`);
        } catch (e) {
            console.error(`❌ Gagal -> ${env}`);
        }
    }
}

try { fs.unlinkSync('.temp_env_val.txt'); } catch (e) { }
console.log('\n✅ Perbaikan Environment berhasil diselesaikan.');
