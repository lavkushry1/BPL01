-- Reset Database SQL Script for Eventia Ticketing Platform

-- Connect to PostgreSQL server
\connect postgres;

-- Drop the database if it exists
DROP DATABASE IF EXISTS eventia;

-- Create a new database
CREATE DATABASE eventia
    WITH
    OWNER = eventia
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0
    CONNECTION LIMIT = -1;

-- Connect to the new database
\connect eventia;

-- Create schema versions table for Prisma
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id VARCHAR(36) PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
);

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create events table
CREATE TABLE IF NOT EXISTS "events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "capacity" INTEGER,
    "image_url" TEXT,
    "organizer_id" UUID NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- Add is_deleted and deleted_at to all tables that need soft delete functionality
-- Create ticket_categories table
CREATE TABLE IF NOT EXISTS "ticket_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "total_seats" INTEGER NOT NULL DEFAULT 0, 
    "booked_seats" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER,
    "available" INTEGER DEFAULT 0,
    "event_id" UUID NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- Create seats table
CREATE TABLE IF NOT EXISTS "seats" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "label" TEXT,
    "row" TEXT,
    "seat_number" TEXT,
    "section" TEXT,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "price" DECIMAL(10,2),
    "meta" JSONB DEFAULT '{}',
    "event_id" UUID NOT NULL,
    "ticket_category_id" UUID,
    "payment_intent_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS "bookings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "final_amount" DECIMAL(10,2) NOT NULL,
    "seats" JSONB,
    "discount_id" UUID,
    "payment_session_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS "tickets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "booking_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "ticket_category_id" UUID NOT NULL,
    "seat_id" UUID,
    "user_id" UUID,
    "price" DECIMAL(10,2) NOT NULL,
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tickets_code_key" UNIQUE ("code")
);

-- Create foreign key constraints
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seats" ADD CONSTRAINT "seats_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_category_id_fkey" FOREIGN KEY ("ticket_category_id") REFERENCES "ticket_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_is_deleted_idx" ON "users"("is_deleted");

CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");
CREATE INDEX "events_status_idx" ON "events"("status");
CREATE INDEX "events_start_date_end_date_idx" ON "events"("start_date", "end_date");
CREATE INDEX "events_is_deleted_idx" ON "events"("is_deleted");

CREATE INDEX "ticket_categories_event_id_idx" ON "ticket_categories"("event_id");
CREATE INDEX "ticket_categories_is_deleted_idx" ON "ticket_categories"("is_deleted");

CREATE INDEX "seats_event_id_idx" ON "seats"("event_id");
CREATE INDEX "seats_status_idx" ON "seats"("status");
CREATE INDEX "seats_is_deleted_idx" ON "seats"("is_deleted");

CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");
CREATE INDEX "bookings_event_id_idx" ON "bookings"("event_id");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at");
CREATE INDEX "bookings_is_deleted_idx" ON "bookings"("is_deleted");

CREATE INDEX "tickets_code_idx" ON "tickets"("code");
CREATE INDEX "tickets_booking_id_idx" ON "tickets"("booking_id");
CREATE INDEX "tickets_event_id_idx" ON "tickets"("event_id");
CREATE INDEX "tickets_user_id_idx" ON "tickets"("user_id");
CREATE INDEX "tickets_status_idx" ON "tickets"("status");
CREATE INDEX "tickets_is_deleted_idx" ON "tickets"("is_deleted");

-- Create default admin user (password is hashed version of 'admin123')
INSERT INTO "users" ("email", "name", "password", "role", "verified")
VALUES ('admin@eventia.com', 'Admin User', '$2b$10$PnKFSnFMYY4hQlBg4sGPNu6aZVJZeT7O7d2V.2p.zw03q9X0jLQ0u', 'ADMIN', true);

-- Report completion
\echo 'Database reset completed successfully!';
\echo 'Created tables: users, events, ticket_categories, seats, bookings, tickets';
\echo 'Default admin user created: admin@eventia.com with password: admin123'; 