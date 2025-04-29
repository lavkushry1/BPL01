"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateSyncService = void 0;
const socket_io_1 = require("socket.io");
const prisma_1 = __importDefault(require("../db/prisma"));
const apiError_1 = require("../utils/apiError");
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
            await prisma_1.default.seatLock.upsert({
                where: { seatId },
                create: {
                    seatId,
                    userId,
                    expiresAt
                },
                update: {
                    userId,
                    expiresAt
                }
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
            await prisma_1.default.seatLock.delete({
                where: { seatId }
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
            const lock = await prisma_1.default.seatLock.findUnique({
                where: { seatId }
            });
            if (!lock)
                return null;
            // If lock has expired, clean it up
            if (lock.expiresAt <= new Date()) {
                await prisma_1.default.seatLock.delete({
                    where: { seatId }
                });
                return null;
            }
            // Cache this lock in memory
            this.activeLocks.set(seatId, {
                userId: lock.userId,
                expiresAt: lock.expiresAt
            });
            return {
                userId: lock.userId,
                expiresAt: lock.expiresAt
            };
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
     * Clean up expired locks automatically
     */
    static startLockCleanupJob() {
        // Run cleanup every minute
        setInterval(async () => {
            const now = new Date();
            // Clean memory locks
            for (const [seatId, lock] of this.activeLocks.entries()) {
                if (lock.expiresAt <= now) {
                    this.activeLocks.delete(seatId);
                }
            }
            // Clean database locks
            try {
                await prisma_1.default.seatLock.deleteMany({
                    where: {
                        expiresAt: {
                            lte: now
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error cleaning up expired locks:', error);
            }
        }, 60000); // Every minute
    }
    /**
     * Bulk check seat availability with locking
     * @param seatIds Array of seat IDs to check
     * @returns Object with available and unavailable seats
     */
    static async bulkCheckAvailability(seatIds) {
        const availableSeats = [];
        const unavailableSeats = [];
        const lockedSeats = [];
        await Promise.all(seatIds.map(async (seatId) => {
            const lock = await this.checkSeatLock(seatId);
            if (!lock) {
                availableSeats.push(seatId);
            }
            else {
                unavailableSeats.push(seatId);
                lockedSeats.push({
                    seatId,
                    userId: lock.userId,
                    expiresAt: lock.expiresAt
                });
            }
        }));
        return {
            availableSeats,
            unavailableSeats,
            lockedSeats
        };
    }
}
exports.StateSyncService = StateSyncService;
