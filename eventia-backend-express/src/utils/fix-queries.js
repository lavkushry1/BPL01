const { db } = require('../db');

async function fixColumnQueries() {
  try {
    console.log('Starting database fixes...');

    // Fix issue with seats table
    await db.raw(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'seats' AND column_name = 'lockedBy'
        ) THEN
          ALTER TABLE "seats" DROP COLUMN "lockedBy";
        END IF;
      END $$;
    `);
    console.log('Fixed seats table columns');

    // Fix issue with ticket_generation_queue table
    await db.raw(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'ticket_generation_queue' AND column_name = 'maxAttempts'
        ) THEN
          ALTER TABLE "ticket_generation_queue" DROP COLUMN "maxAttempts";
        END IF;
      END $$;
    `);
    console.log('Fixed ticket_generation_queue table columns');

    // Create missing indices
    await db.raw(`
      CREATE INDEX IF NOT EXISTS "reservation_expiry_queue_processed_idx" ON "reservation_expiry_queue"("processed");
      CREATE INDEX IF NOT EXISTS "reservation_expiry_queue_expires_at_idx" ON "reservation_expiry_queue"("expires_at");
      CREATE INDEX IF NOT EXISTS "ticket_generation_queue_next_attempt_at_attempts_idx" ON "ticket_generation_queue"("next_attempt_at", "attempts");
    `);
    console.log('Created missing indices');

    console.log('All database fixes completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

fixColumnQueries(); 