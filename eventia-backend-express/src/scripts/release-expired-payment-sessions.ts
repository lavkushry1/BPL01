/**
 * Script to release expired payment sessions
 * 
 * This script is meant to be run as a cron job every minute
 * to free up seats that have been locked but payment wasn't completed.
 */

import { UpiPaymentController } from '../controllers/upiPayment.controller';
import { logger } from '../utils/logger';

async function releaseExpiredPaymentSessions() {
    try {
        logger.info('Starting expired payment sessions cleanup job');

        const releasedCount = await UpiPaymentController.releaseExpiredSessions();

        logger.info(`Released ${releasedCount} expired payment sessions`);
    } catch (error) {
        logger.error('Error in expired payment sessions cleanup job:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    releaseExpiredPaymentSessions()
        .then(() => {
            logger.info('Expired payment sessions cleanup completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Expired payment sessions cleanup failed:', error);
            process.exit(1);
        });
}

export default releaseExpiredPaymentSessions; 