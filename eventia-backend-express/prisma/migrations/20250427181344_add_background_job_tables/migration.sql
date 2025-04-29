-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "price" DECIMAL(10,2) NOT NULL,
    "eventId" TEXT NOT NULL,
    "lockedBy" TEXT,
    "locked_by" TEXT,
    "lock_expires_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_expiry_queue" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_expiry_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_generation_queue" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "next_attempt_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_generation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seats_status_idx" ON "seats"("status");

-- CreateIndex
CREATE INDEX "seats_eventId_status_idx" ON "seats"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "seats_eventId_section_row_seatNumber_key" ON "seats"("eventId", "section", "row", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_expiry_queue_bookingId_key" ON "reservation_expiry_queue"("bookingId");

-- CreateIndex
CREATE INDEX "reservation_expiry_queue_expires_at_idx" ON "reservation_expiry_queue"("expires_at");

-- CreateIndex
CREATE INDEX "reservation_expiry_queue_processed_idx" ON "reservation_expiry_queue"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_generation_queue_bookingId_key" ON "ticket_generation_queue"("bookingId");

-- CreateIndex
CREATE INDEX "ticket_generation_queue_next_attempt_at_attempts_idx" ON "ticket_generation_queue"("next_attempt_at", "attempts");

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
