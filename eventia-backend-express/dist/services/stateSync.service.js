"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateSyncService = void 0;
const socket_io_1 = require("socket.io");
const apiError_1 = require("../utils/apiError");
const db_1 = require("../db");
/**
 * State Synchronization Service
 *
 * This service handles real-time state synchronization across multiple users
 * for seat reservations, booking status, and other critical state.
 *
 * It uses WebSockets to push state updates to all connected clients
 * and implements concurrency control mechanisms to handle seat reservation conflicts.
 */
class StateSyncService {
    static io = null;
    static activeLocks = new Map();
    /**
     * Initialize the state sync service with a HTTP server
     */
    static initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || '*',
                methods: ['GET', 'POST']
            }
        });
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            // Handle joining event-specific rooms
            socket.on('join-event', (eventId) => {
                socket.join(`event:${eventId}`);
                console.log(`Client ${socket.id} joined event:${eventId}`);
            });
            // Handle client disconnection
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
        // Start the lock cleanup job
        this.startLockCleanupJob();
    }
    /**
     * Acquire a lock on a seat to prevent conflicts
     * @param seatId The ID of the seat to lock
     * @param userId The ID of the user acquiring the lock
     * @param durationSeconds How long to maintain the lock (default: 300 seconds = 5 minutes)
     */
    static async acquireSeatLock(seatId, userId, durationSeconds = 300) {
        // Check if seat is already locked
        const existingLock = this.activeLocks.get(seatId);
        if (existingLock && existingLock.expiresAt > new Date()) {
            // If locked by someone else, cannot acquire lock
            if (existingLock.userId !== userId) {
                return false;
            }
            // If locked by same user, extend lock
        }
        // Set expiration time
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + durationSeconds);
        // Record lock in memory
        this.activeLocks.set(seatId, { userId, expiresAt });
        // Also record in database for persistence across service restarts
        try {
            // Update the seats table directly
            await (0, db_1.db)('seats')
                .where({ id: seatId })
                .update({
                locked_by: userId,
                lock_expires_at: expiresAt,
                status: 'locked',
                updated_at: new Date()
            });
            // Notify all clients about this seat's status change
            this.notifySeatStatusChange(seatId, 'locked', userId);
            return true;
        }
        catch (error) {
            console.error('Error acquiring seat lock:', error);
            return false;
        }
    }
    /**
     * Release a lock on a seat
     * @param seatId The ID of the seat to unlock
     * @param userId The ID of the user releasing the lock
     */
    static async releaseSeatLock(seatId, userId) {
        // Check if lock exists and belongs to user
        const existingLock = this.activeLocks.get(seatId);
        if (existingLock && existingLock.userId !== userId) {
            throw new apiError_1.ApiError(403, 'Cannot release lock owned by another user', 'FORBIDDEN');
        }
        // Remove lock from memory
        this.activeLocks.delete(seatId);
        // Also remove from database
        try {
            // Update the seat directly to release the lock
            await (0, db_1.db)('seats')
                .where({ id: seatId })
                .update({
                locked_by: null,
                lock_expires_at: null,
                status: 'available',
                updated_at: new Date()
            });
            // Notify all clients about this seat's status change
            this.notifySeatStatusChange(seatId, 'available');
            return true;
        }
        catch (error) {
            console.error('Error releasing seat lock:', error);
            return false;
        }
    }
    /**
     * Check if a seat is currently locked
     * @param seatId The ID of the seat to check
     * @returns lock information if locked, null if available
     */
    static async checkSeatLock(seatId) {
        // Check in-memory cache first
        const memoryLock = this.activeLocks.get(seatId);
        if (memoryLock) {
            // If lock has expired, clean it up
            if (memoryLock.expiresAt <= new Date()) {
                this.activeLocks.delete(seatId);
                return null;
            }
            return memoryLock;
        }
        // If not in memory, check database
        try {
            // Get seat lock information directly from seats table
            const seat = await (0, db_1.db)('seats')
                .where({ id: seatId })
                .first('locked_by', 'lock_expires_at');
            if (!seat || !seat.locked_by || !seat.lock_expires_at) {
                return null;
            }
            // If lock has expired, clean it up
            if (new Date(seat.lock_expires_at) <= new Date()) {
                await (0, db_1.db)('seats')
                    .where({ id: seatId })
                    .update({
                    locked_by: null,
                    lock_expires_at: null,
                    status: 'available',
                    updated_at: new Date()
                });
                return null;
            }
            // Cache this lock in memory
            const lockData = {
                userId: seat.locked_by,
                expiresAt: new Date(seat.lock_expires_at)
            };
            this.activeLocks.set(seatId, lockData);
            return lockData;
        }
        catch (error) {
            console.error('Error checking seat lock:', error);
            return null;
        }
    }
    /**
     * Notify all clients about a seat's status change
     * @param seatId The ID of the seat that changed
     * @param status The new status of the seat
     * @param userId The ID of the user who changed the status (optional)
     */
    static notifySeatStatusChange(seatId, status, userId) {
        if (!this.io)
            return;
        this.io.emit('seat-status-change', {
            seatId,
            status,
            userId,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Notify all clients about booking status changes
     * @param bookingId The ID of the booking that changed
     * @param status The new status of the booking
     */
    static notifyBookingStatusChange(bookingId, status) {
        if (!this.io)
            return;
        this.io.emit('booking-status-change', {
            bookingId,
            status,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Start a background job to clean up expired locks
     */
    static startLockCleanupJob() {
        // Run every minute
        setInterval(async () => {
            try {
                const now = new Date();
                // Clean up memory locks
                for (const [seatId, lock] of this.activeLocks.entries()) {
                    if (lock.expiresAt <= now) {
                        this.activeLocks.delete(seatId);
                    }
                }
                // Clean up database locks
                const expiredSeats = await (0, db_1.db)('seats')
                    .where('lock_expires_at', '<=', now)
                    .whereNotNull('locked_by');
                if (expiredSeats.length > 0) {
                    const seatIds = expiredSeats.map((seat) => seat.id);
                    await (0, db_1.db)('seats')
                        .whereIn('id', seatIds)
                        .update({
                        locked_by: null,
                        lock_expires_at: null,
                        status: 'available',
                        updated_at: new Date()
                    });
                    // Notify clients about released seats
                    for (const seatId of seatIds) {
                        this.notifySeatStatusChange(seatId, 'available');
                    }
                    console.log(`Cleaned up ${seatIds.length} expired seat locks`);
                }
            }
            catch (error) {
                console.error('Error in lock cleanup job:', error);
            }
        }, 60_000); // Run every minute
    }
    /**
     * Bulk check seat availability
     * @param seatIds Array of seat IDs to check
     * @returns Object with available and unavailable seat information
     */
    static async bulkCheckAvailability(seatIds) {
        const now = new Date();
        const result = {
            availableSeats: [],
            unavailableSeats: [],
            lockedSeats: []
        };
        try {
            // Get all seats data
            const seats = await (0, db_1.db)('seats')
                .whereIn('id', seatIds)
                .select('id', 'status', 'locked_by', 'lock_expires_at');
            for (const seat of seats) {
                // Seat is available if:
                // 1. Status is 'available'
                // 2. Not locked, OR lock has expired
                const isLocked = seat.locked_by && seat.lock_expires_at && new Date(seat.lock_expires_at) > now;
                if (seat.status === 'available' && !isLocked) {
                    result.availableSeats.push(seat.id);
                }
                else if (isLocked) {
                    // Seat is locked by someone
                    result.lockedSeats.push({
                        seatId: seat.id,
                        userId: seat.locked_by,
                        expiresAt: new Date(seat.lock_expires_at)
                    });
                    result.unavailableSeats.push(seat.id);
                }
                else {
                    // Seat is unavailable (booked or otherwise unavailable)
                    result.unavailableSeats.push(seat.id);
                }
            }
            return result;
        }
        catch (error) {
            console.error('Error checking bulk seat availability:', error);
            throw error;
        }
    }
}
exports.StateSyncService = StateSyncService;
