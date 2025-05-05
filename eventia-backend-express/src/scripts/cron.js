/**
 * Cron job script for Eventia backend
 * 
 * This script runs all scheduled background tasks at specified intervals
 * using node-cron. It is meant to be run as a separate process alongside
 * the main Express server.
 */

const cron = require('node-cron');
const releaseExpiredLocks = require('./release-expired-locks').default;
const releaseExpiredPaymentSessions = require('./release-expired-payment-sessions').default;
const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Log directory for storing execution logs
const logDir = path.join(__dirname, '../../logs/cron');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Log file path with date
const getLogFile = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    return path.join(logDir, `cron-${date}.log`);
};

// Helper to log to both console and file
const logToFile = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    // Log to console
    logger.info(message);

    // Log to file
    fs.appendFileSync(getLogFile(), logMessage);
};

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
    logToFile('Starting Eventia cron jobs...');

    // Release expired seat locks every minute
    // Format: '* * * * *' (minute, hour, day of month, month, day of week)
    cron.schedule('* * * * *', async () => {
        try {
            logToFile('Running expired seat locks cleanup task');
            const count = await releaseExpiredLocks();
            logToFile(`Released ${count} expired seat locks`);
        } catch (error) {
            logToFile(`Error in expired locks cleanup: ${error.message}`);
        }
    });

    // Release expired payment sessions every minute
    cron.schedule('* * * * *', async () => {
        try {
            logToFile('Running expired payment sessions cleanup task');
            const count = await releaseExpiredPaymentSessions();
            logToFile(`Released ${count} expired payment sessions`);
        } catch (error) {
            logToFile(`Error in expired payment sessions cleanup: ${error.message}`);
        }
    });

    // Add more cron jobs here as needed
    // Example: Daily reports generation at midnight
    // cron.schedule('0 0 * * *', generateDailyReports);

    logToFile('All cron jobs initialized successfully');
};

// Start the cron jobs if run directly
if (require.main === module) {
    initCronJobs();
} else {
    // Export for programmatic usage
    module.exports = { initCronJobs };
} 