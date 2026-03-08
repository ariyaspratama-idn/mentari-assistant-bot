/* 
   SALIN DAN TEMPEL KODE INI DI CONSOLE BROWSER MENTARI (F12) 
   UNTUK MENDAPATKAN TOKEN TERBARU
*/

(function () {
    const jwt = localStorage.getItem('token');
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});

    const output = `
--------------------------------------------------
✅ TOKEN MENTARI TERDETEKSI (SALIN KE .ENV / GITHUB)
--------------------------------------------------
MENTARI_JWT=${jwt}
CF_CLEARANCE=${cookies['cf_clearance'] || 'TIDAK_ADA'}
SL_SESSION=${cookies['sl-session'] || 'TIDAK_ADA'}
STOKEN=${cookies['stoken'] || 'TIDAK_ADA'}
--------------------------------------------------
`;
    console.log(output);
    alert("Token berhasil diambil! Silakan cek Console (F12) untuk menyalin hasilnya.");
})();
