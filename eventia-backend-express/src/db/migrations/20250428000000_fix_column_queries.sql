-- Fix issue with the seats table having both locked_by and lockedBy columns
-- Keep locked_by and drop lockedBy if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'seats' AND column_name = 'lockedBy'
    ) THEN
        ALTER TABLE "seats" DROP COLUMN "lockedBy";
    END IF;
END $$;

-- Fix column mappings in various tables
-- This migration addresses issues with camelCase column names not properly
-- being mapped to snake_case in the database

-- Start transaction to ensure all operations succeed or fail together
BEGIN;

-- Fix booking_id columns in various tables
UPDATE "ticket_generation_queue" SET "booking_id" = "bookingId" WHERE "bookingId" IS NOT NULL;
ALTER TABLE "ticket_generation_queue" DROP COLUMN IF EXISTS "bookingId";

-- Fix issue with the ticket_generation_queue table
-- Check if the maxAttempts column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'ticket_generation_queue' AND column_name = 'maxAttempts'
  ) THEN
    -- Add the new column
    ALTER TABLE "ticket_generation_queue" ADD COLUMN "max_attempts" INTEGER DEFAULT 5;
    
    -- Copy data from old column
    UPDATE "ticket_generation_queue" SET "max_attempts" = "maxAttempts";
    
    -- Drop the old column
    ALTER TABLE "ticket_generation_queue" DROP COLUMN "maxAttempts";
  END IF;
END $$;

-- Fix next_attempt_at column
UPDATE "ticket_generation_queue" SET "next_attempt_at" = "nextAttemptAt" WHERE "nextAttemptAt" IS NOT NULL;
ALTER TABLE "ticket_generation_queue" DROP COLUMN IF EXISTS "nextAttemptAt";

-- Fix last_attempt_at column
UPDATE "ticket_generation_queue" SET "last_attempt_at" = "lastAttemptAt" WHERE "lastAttemptAt" IS NOT NULL;
ALTER TABLE "ticket_generation_queue" DROP COLUMN IF EXISTS "lastAttemptAt";

-- Fix last_error column
UPDATE "ticket_generation_queue" SET "last_error" = "lastError" WHERE "lastError" IS NOT NULL;
ALTER TABLE "ticket_generation_queue" DROP COLUMN IF EXISTS "lastError";

-- Fix admin_id column
UPDATE "ticket_generation_queue" SET "admin_id" = "adminId" WHERE "adminId" IS NOT NULL;
ALTER TABLE "ticket_generation_queue" DROP COLUMN IF EXISTS "adminId";

-- Fix processed_at column
UPDATE "ticket_generation_queue" SET "processed_at" = "processedAt" WHERE "processedAt" IS NOT NULL;
ALTER TABLE "ticket_generation_queue" DROP COLUMN IF EXISTS "processedAt";

-- Create missing indices to match schema
CREATE INDEX IF NOT EXISTS "reservation_expiry_queue_processed_idx" ON "reservation_expiry_queue"("processed");
CREATE INDEX IF NOT EXISTS "reservation_expiry_queue_expires_at_idx" ON "reservation_expiry_queue"("expires_at");
CREATE INDEX IF NOT EXISTS "ticket_generation_queue_next_attempt_at_attempts_idx" ON "ticket_generation_queue"("next_attempt_at", "attempts");

-- Commit all changes
COMMIT; 