const { runBot } = require('../bot');

module.exports = async (req, res) => {
    // Tangkap semua console.log dari runBot
    const logs = [];
    const origLog = console.log;
    const origError = console.error;

    console.log = (...args) => {
        logs.push('[INFO] ' + args.join(' '));
        origLog(...args);
    };
    console.error = (...args) => {
        logs.push('[ERR] ' + args.join(' '));
        origError(...args);
    };

    try {
        await runBot();

        // Kembalikan console.log ke aslinya
        console.log = origLog;
        console.error = origError;

        res.status(200).json({
            success: true,
            logs: logs
        });
    } catch (error) {
        console.log = origLog;
        console.error = origError;

        res.status(500).json({
            success: false,
            error: error.message,
            logs: logs
        });
    }
};
