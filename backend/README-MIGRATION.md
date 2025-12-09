# UPI Payment Integration Database Migration

This document describes the database changes required for the UPI payment integration and how to apply them correctly.

## Overview

The UPI payment integration adds several new tables and modifies existing ones:

1. New Tables:
   - `payment_sessions` - Tracks payment sessions with UPI QR codes and UTR verification
   - `payment_intents` - Records payment intentions
   - `tickets` - Stores generated tickets for bookings

2. Modified Tables:
   - `bookings` - Add payment_session_id reference
   - `seats` - Add locked_until field and payment_intent_id reference

## Migration Method

Due to permission issues with Prisma's standard migration approach, we've created a custom migration process:

1. The schema.prisma file has been updated with the new models
2. SQL migration files have been created in the prisma/migrations directory
3. A custom script applies these migrations directly to the database

## How to Apply Migrations

### Step 1: Update Prisma Schema

The schema.prisma file has already been updated with the new models:
- PaymentSession
- PaymentIntent
- Ticket

### Step 2: Run Custom Migration Script

Run the custom migration script to apply the SQL changes:

```bash
node scripts/apply-custom-migrations.js
```

This script will apply all necessary migrations, handling permission issues gracefully by continuing with statements that succeed.

### Step 3: Generate Prisma Client

After applying migrations, generate the updated Prisma client:

```bash
npx prisma generate
```

### Step 4: Apply Manual SQL If Needed

If you have proper permissions, you may need to run these additional SQL commands:

```sql
-- Add payment_session_id to bookings table if it doesn't exist
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_session_id" TEXT UNIQUE;
ALTER TABLE "bookings" ADD CONSTRAINT IF NOT EXISTS "bookings_payment_session_id_fkey" 
  FOREIGN KEY ("payment_session_id") REFERENCES "payment_sessions"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add fields to seats table if they don't exist
ALTER TABLE "seats" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP(3);
ALTER TABLE "seats" ADD COLUMN IF NOT EXISTS "payment_intent_id" TEXT;
ALTER TABLE "seats" ADD CONSTRAINT IF NOT EXISTS "seats_payment_intent_id_fkey" 
  FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;
```

## Verification

After applying migrations, you can verify they were applied correctly:

1. Check if tables were created:
```sql
SELECT * FROM pg_tables WHERE tablename IN ('payment_sessions', 'payment_intents', 'tickets');
```

2. Check if columns were added:
```sql
SELECT column_name FROM information_schema.columns WHERE 
table_name = 'bookings' AND column_name = 'payment_session_id';

SELECT column_name FROM information_schema.columns WHERE 
table_name = 'seats' AND column_name IN ('locked_until', 'payment_intent_id');
```

## Rollback Procedure

In case you need to rollback the changes:

```sql
-- Drop foreign keys and relationships first
ALTER TABLE IF EXISTS "bookings" DROP CONSTRAINT IF EXISTS "bookings_payment_session_id_fkey";
ALTER TABLE IF EXISTS "seats" DROP CONSTRAINT IF EXISTS "seats_payment_intent_id_fkey";

-- Drop the join table
DROP TABLE IF EXISTS "_PaymentSessionToSeat";

-- Drop the new tables
DROP TABLE IF EXISTS "payment_sessions";
DROP TABLE IF EXISTS "payment_intents";
DROP TABLE IF EXISTS "tickets";

-- Remove added columns
ALTER TABLE IF EXISTS "bookings" DROP COLUMN IF EXISTS "payment_session_id";
ALTER TABLE IF EXISTS "seats" DROP COLUMN IF EXISTS "locked_until";
ALTER TABLE IF EXISTS "seats" DROP COLUMN IF EXISTS "payment_intent_id";
```

## Troubleshooting

If you encounter TypeScript errors after migration:
1. Make sure the Prisma client was regenerated with `npx prisma generate`
2. Check for any remaining type errors in controllers and services
3. If you get "Property does not exist on type" errors, ensure the model definition in schema.prisma is correct

## Need Help?

If you encounter any issues running the migration, please contact the development team for assistance. 