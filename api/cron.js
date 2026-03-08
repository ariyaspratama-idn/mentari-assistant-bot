const { runBot } = require('../bot');

module.exports = async (req, res) => {
    // Verifikasi request dari Vercel Cron (opsional - bisa dikonfigurasi via CRON_SECRET)
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.authorization !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await runBot();
        res.status(200).json({
            success: true,
            message: 'Bot selesai dijalankan',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Cron error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
