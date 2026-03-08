const fs = require('fs');
const { execSync } = require('child_process');

const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');

const envList = ['production', 'preview', 'development'];

console.log('--- Setting Vercel Environment Variables ---');

for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const splitIdx = line.indexOf('=');
    if (splitIdx === -1) continue;

    const key = line.substring(0, splitIdx).trim();
    let val = line.substring(splitIdx + 1).trim();

    // Remove surrounding quotes if any
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
    }

    if (!key || val === undefined) continue;

    console.log(`Setting ${key}...`);

    // Remove existing first to avoid prompt conflict
    try {
        execSync(`vercel env rm ${key} production preview development -y`, { stdio: 'ignore' });
    } catch (e) { }

    // Add for each env
    for (const env of envList) {
        try {
            execSync(`echo "${val.replace(/"/g, '\\"')}" | vercel env add ${key} ${env}`, { stdio: 'ignore', shell: true });
        } catch (err) {
            console.error(`❌ Failed to set ${key} for ${env}`);
        }
    }
    console.log(`✅ ${key} set successfully.\n`);
}

console.log('--- All Environment Variables Processed ---');
