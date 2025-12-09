/**
 * Fix for ticket_generation_queue table column mappings
 * This script addresses the issue where the maxAttempts field was incorrectly
 * created in the database without proper snake case mapping
 */
import { db } from '../db';
import { logger } from './logger';

/**
 * Fixes column name mappings in the ticket_generation_queue table
 * - Checks if maxAttempts column exists
 * - Renames it to max_attempts
 * - Creates index on next_attempt_at and attempts columns
 */
export async function fixTicketGenerationQueue(): Promise<void> {
  try {
    logger.info('Starting ticket_generation_queue table fix...');

    // Check if the table exists
    const tableExists = await db.schema.hasTable('ticket_generation_queue');
    if (!tableExists) {
      logger.info('ticket_generation_queue table does not exist, skipping fix');
      return;
    }

    // Check if maxAttempts column exists
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ticket_generation_queue' AND column_name = 'maxAttempts'
    `);

    const hasMaxAttemptsColumn = columns.rows && columns.rows.length > 0;

    if (hasMaxAttemptsColumn) {
      logger.info('Found maxAttempts column, renaming to max_attempts...');

      // Create a transaction to ensure all operations succeed or fail together
      await db.transaction(async (trx) => {
        // First, add the new column
        await trx.schema.table('ticket_generation_queue', (table) => {
          table.integer('max_attempts').defaultTo(5);
        });

        // Copy data from old column to new column
        await trx.raw(`
          UPDATE ticket_generation_queue 
          SET max_attempts = "maxAttempts"
        `);

        // Drop the old column
        await trx.schema.table('ticket_generation_queue', (table) => {
          table.dropColumn('maxAttempts');
        });

        logger.info('Successfully renamed maxAttempts to max_attempts');

        // Create index if it doesn't exist
        const indexExists = await trx.raw(`
          SELECT indexname 
          FROM pg_indexes 
          WHERE indexname = 'ticket_generation_queue_next_attempt_at_attempts_idx'
        `);

        if (!indexExists.rows || indexExists.rows.length === 0) {
          logger.info('Creating index on next_attempt_at and attempts columns...');
          await trx.raw(`
            CREATE INDEX IF NOT EXISTS "ticket_generation_queue_next_attempt_at_attempts_idx" 
            ON "ticket_generation_queue"("next_attempt_at", "attempts")
          `);
          logger.info('Successfully created index');
        } else {
          logger.info('Index already exists, skipping creation');
        }
      });

      logger.info('ticket_generation_queue table fix completed successfully');
    } else {
      logger.info('maxAttempts column not found, table is already fixed');
    }
  } catch (error) {
    logger.error('Error fixing ticket_generation_queue table:', error);
    throw error;
  }
}

// Execute the fix if this script is run directly
if (require.main === module) {
  fixTicketGenerationQueue()
    .then(() => {
      logger.info('Fix completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fix failed:', error);
      process.exit(1);
    });
} 