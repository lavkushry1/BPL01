/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    // Fix issue with the seats table having both locked_by and lockedBy columns
    knex.schema.raw(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'seats' AND column_name = 'lockedBy'
        ) THEN
          ALTER TABLE "seats" DROP COLUMN "lockedBy";
        END IF;
      END $$;
    `),
    
    // Fix issue with the ticket_generation_queue table column names
    knex.schema.raw(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'ticket_generation_queue' AND column_name = 'maxAttempts'
        ) THEN
          ALTER TABLE "ticket_generation_queue" DROP COLUMN "maxAttempts";
        END IF;
      END $$;
    `),
    
    // Create missing indices to match schema
    knex.schema.raw(`
      CREATE INDEX IF NOT EXISTS "reservation_expiry_queue_processed_idx" ON "reservation_expiry_queue"("processed");
      CREATE INDEX IF NOT EXISTS "reservation_expiry_queue_expires_at_idx" ON "reservation_expiry_queue"("expires_at");
      CREATE INDEX IF NOT EXISTS "ticket_generation_queue_next_attempt_at_attempts_idx" ON "ticket_generation_queue"("next_attempt_at", "attempts");
    `)
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    // Drop created indices
    knex.schema.raw(`
      DROP INDEX IF EXISTS "reservation_expiry_queue_processed_idx";
      DROP INDEX IF EXISTS "reservation_expiry_queue_expires_at_idx";
      DROP INDEX IF EXISTS "ticket_generation_queue_next_attempt_at_attempts_idx";
    `)
  ]);
};
