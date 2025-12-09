/**
 * Script to release expired seat locks
 *
 * This script is meant to be run as a cron job every minute
 * to free up seats that have been locked but payment wasn't completed.
 */

import { SeatLockingService } from '../services/seatLocking.service';
import { logger } from '../utils/logger';

async function releaseExpiredLocks() {
    try {
        logger.info('Starting expired locks cleanup job');

        const releasedCount = await SeatLockingService.cleanupExpiredDbLocks();

        logger.info(`Released ${releasedCount} expired seat locks`);
    } catch (error) {
        logger.error('Error in expired locks cleanup job:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    releaseExpiredLocks()
        .then(() => {
            logger.info('Expired locks cleanup completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Expired locks cleanup failed:', error);
            process.exit(1);
        });
}

export default releaseExpiredLocks;
