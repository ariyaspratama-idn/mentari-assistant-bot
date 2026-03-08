const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Memulai Setup Otomatis GitHub Secrets...\n');

try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    const secrets = {};

    lines.forEach(line => {
        const match = line.match(/^([^#\s]+)=(.+)$/);
        if (match) {
            secrets[match[1]] = match[2].trim();
        }
    });

    console.log('📦 Menemukan variabel berikut di .env:');
    Object.keys(secrets).forEach(key => console.log(` - ${key}`));

    console.log('\n---------------------------------------------------------');
    console.log('⚠️ INSTRUKSI MANUAL (KARENA GH CLI TIDAK TERPASANG) ⚠️');
    console.log('---------------------------------------------------------');
    console.log('Silakan buka link ini di browser Anda:');
    console.log('https://github.com/ariyaspratama-idn/mentari-assistant-bot/settings/secrets/actions/new');
    console.log('\nMasukkan satu per satu variabel di atas ke halaman tersebut.');
    console.log('Contoh:');
    console.log('Name: MENTARI_JWT');
    console.log('Value: [Salin isi MENTARI_JWT dari file .env Anda]');
    console.log('---------------------------------------------------------\n');

} catch (err) {
    console.error('❌ Gagal membaca .env:', err.message);
}
