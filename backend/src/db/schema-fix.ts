
import { logger } from '../utils/logger';
import { db } from './index';

export const fixDatabaseSchema = async (): Promise<void> => {
  try {
    logger.info('Checking database schema integrity...');

    // Check for seats table
    const hasSeats = await db.schema.hasTable('seats');
    if (hasSeats) {
      // Check for locked_by column
      const hasLockedBy = await db.schema.hasColumn('seats', 'locked_by');
      if (!hasLockedBy) {
        logger.warn('Missing column "locked_by" in "seats" table. Attempting auto-repair...');
        await db.schema.alterTable('seats', (table) => {
          table.string('locked_by').nullable();
        });
        logger.info('Successfully added "locked_by" column.');
      }

      // Check for lock_expires_at column
      const hasLockExpiresAt = await db.schema.hasColumn('seats', 'lock_expires_at');
      if (!hasLockExpiresAt) {
        logger.warn('Missing column "lock_expires_at" in "seats" table. Attempting auto-repair...');
        await db.schema.alterTable('seats', (table) => {
          table.timestamp('lock_expires_at').nullable();
        });
        logger.info('Successfully added "lock_expires_at" column.');
      }
    }

    logger.info('Database schema integrity check completed.');
  } catch (error) {
    logger.error('Failed to auto-repair database schema:', error);
    // Don't throw, let the server try to start anyway
  }
};
