"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketService = void 0;
const logger_1 = require("../utils/logger");
/**
 * Service for handling WebSocket communications
 * with improved error handling and reliability
 */
class WebsocketService {
    static io;
    static isInitialized = false;
    /**
     * Initialize the WebSocket service with a Socket.IO server instance
     */
    static initialize(io) {
        WebsocketService.io = io;
        WebsocketService.isInitialized = true;
        logger_1.logger.info('WebSocket service initialized');
        WebsocketService.registerHandlers();
    }
    /**
     * Safely send a WebSocket message with proper error handling
     * @param targetRoom The room or socket to emit to
     * @param eventName Event name
     * @param data Event data
     * @returns Success status
     */
    static safeEmit(targetRoom, eventName, data) {
        if (!WebsocketService.isInitialized) {
            logger_1.logger.warn(`WebSocket server not initialized. Cannot emit ${eventName}`);
            return false;
        }
        try {
            // Add timestamp if not present
            const eventData = {
                ...data,
                timestamp: data.timestamp || new Date().toISOString()
            };
            if (targetRoom) {
                targetRoom.emit(eventName, eventData);
                return true;
            }
            else {
                logger_1.logger.warn(`Invalid WebSocket target for event ${eventName}`);
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error(`Error emitting WebSocket event ${eventName}:`, error);
            return false;
        }
    }
    /**
     * Notify clients about seat status changes
     * @param seatIds Array of seat IDs that changed status
     * @param status The new status of the seats
     * @returns Success status
     */
    static notifySeatStatusChange(seatIds, status) {
        try {
            if (!WebsocketService.isInitialized) {
                logger_1.logger.warn('WebSocket server not initialized for seat status change');
                return false;
            }
            return WebsocketService.safeEmit(WebsocketService.io, 'seat_status_change', {
                seat_ids: seatIds,
                status,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Error in notifySeatStatusChange:', error);
            return false;
        }
    }
    /**
     * Broadcast seat update to all clients for a specific event
     * @param eventId The event ID
     * @param seatIds Array of seat IDs that changed status
     * @param status The new status of the seats
     * @param userId Optional user ID who made the change
     * @returns Success status
     */
    static broadcastSeatUpdate(eventId, seatIds, status, userId) {
        try {
            if (!WebsocketService.isInitialized) {
                logger_1.logger.warn('WebSocket server not initialized for seat update broadcast');
                return false;
            }
            // Broadcast to the event room
            const result = WebsocketService.safeEmit(WebsocketService.io.to(`event:${eventId}`), 'seat_update', {
                seat_ids: seatIds,
                status,
                updated_by: userId || 'system',
                timestamp: new Date().toISOString()
            });
            if (result) {
                logger_1.logger.debug(`Broadcast to event ${eventId}: Seats ${seatIds.length > 5 ? `${seatIds.slice(0, 5).join(', ')}...` : seatIds.join(', ')} changed to ${status}`);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error in broadcastSeatUpdate for event ${eventId}:`, error);
            return false;
        }
    }
    /**
     * Send a message to a specific user
     * @param userId The user ID to send the message to
     * @param messageType The type of message
     * @param data The message data
     * @returns Success status
     */
    static sendToUser(userId, messageType, data) {
        try {
            if (!WebsocketService.isInitialized) {
                logger_1.logger.warn(`WebSocket server not initialized for sending ${messageType} to user ${userId}`);
                return false;
            }
            const result = WebsocketService.safeEmit(WebsocketService.io.to(`user:${userId}`), messageType, {
                ...data,
                timestamp: new Date().toISOString()
            });
            if (result) {
                logger_1.logger.debug(`Sent ${messageType} to user ${userId}`);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error in sendToUser for user ${userId}, message ${messageType}:`, error);
            return false;
        }
    }
    /**
     * Send a message to all admins
     * @param messageType The type of message
     * @param data The message data
     * @returns Success status
     */
    static sendToAdmins(messageType, data) {
        try {
            if (!WebsocketService.isInitialized) {
                logger_1.logger.warn(`WebSocket server not initialized for sending ${messageType} to admins`);
                return false;
            }
            const result = WebsocketService.safeEmit(WebsocketService.io.to('admin'), messageType, {
                ...data,
                timestamp: new Date().toISOString()
            });
            if (result) {
                logger_1.logger.debug(`Sent ${messageType} to all admins`);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error in sendToAdmins for message ${messageType}:`, error);
            return false;
        }
    }
    /**
     * Notify clients about booking status changes
     * @param bookingId Booking ID
     * @param status New status of the booking
     * @param userId Optional user ID who made the booking
     * @returns Success status
     */
    static notifyBookingStatusChange(bookingId, status, userId) {
        try {
            if (!WebsocketService.isInitialized) {
                logger_1.logger.warn('WebSocket server not initialized for booking status change');
                return false;
            }
            // Broadcast to everyone
            const broadcastResult = WebsocketService.safeEmit(WebsocketService.io, 'booking_status_change', {
                booking_id: bookingId,
                status,
                timestamp: new Date().toISOString()
            });
            // If we have a user ID, send a targeted notification as well
            let userResult = true;
            if (userId) {
                userResult = WebsocketService.sendToUser(userId, 'booking_update', {
                    booking_id: bookingId,
                    status,
                    message: `Your booking #${bookingId} status has been updated to ${status}`,
                    timestamp: new Date().toISOString()
                });
            }
            if (broadcastResult) {
                logger_1.logger.debug(`Notified booking status change for ${bookingId} to ${status}`);
            }
            return broadcastResult && userResult;
        }
        catch (error) {
            logger_1.logger.error(`Error in notifyBookingStatusChange for booking ${bookingId}:`, error);
            return false;
        }
    }
    /**
     * Notify clients about payment status changes
     * @param paymentId Payment ID
     * @param status New status of the payment
     * @param userId Optional user ID who made the payment
     * @returns Success status
     */
    static notifyPaymentStatusChange(paymentId, status, userId) {
        try {
            if (!WebsocketService.isInitialized) {
                logger_1.logger.warn('WebSocket server not initialized for payment status change');
                return false;
            }
            // General notification
            const result = WebsocketService.safeEmit(WebsocketService.io, 'payment_status_change', {
                payment_id: paymentId,
                status,
                timestamp: new Date().toISOString()
            });
            // User-specific notification if we have a user ID
            if (userId) {
                WebsocketService.sendToUser(userId, 'payment_update', {
                    payment_id: paymentId,
                    status,
                    message: `Your payment status has been updated to ${status}`,
                    timestamp: new Date().toISOString()
                });
            }
            if (result) {
                logger_1.logger.debug(`Notified payment status change for ${paymentId} to ${status}`);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error in notifyPaymentStatusChange for payment ${paymentId}:`, error);
            return false;
        }
    }
    /**
     * Notify clients about ticket generation
     * @param bookingId Booking ID
     * @param userId User ID
     * @param ticketIds Array of generated ticket IDs
     * @returns Success status
     */
    static notifyTicketGeneration(bookingId, userId, ticketIds) {
        try {
            if (!WebsocketService.isInitialized) {
                logger_1.logger.warn('WebSocket server not initialized for ticket generation notification');
                return false;
            }
            // General notification
            const broadcastResult = WebsocketService.safeEmit(WebsocketService.io, 'ticket_generation', {
                booking_id: bookingId,
                ticket_count: ticketIds.length,
                timestamp: new Date().toISOString()
            });
            // User-specific notification
            const userResult = WebsocketService.sendToUser(userId, 'tickets_generated', {
                booking_id: bookingId,
                ticket_count: ticketIds.length,
                message: `Your ${ticketIds.length} tickets have been generated successfully`
            });
            if (broadcastResult && userResult) {
                logger_1.logger.debug(`Notified ticket generation for booking ${bookingId}, user ${userId}, ${ticketIds.length} tickets`);
            }
            return broadcastResult && userResult;
        }
        catch (error) {
            logger_1.logger.error(`Error in notifyTicketGeneration for booking ${bookingId}:`, error);
            return false;
        }
    }
    /**
     * Notify admin about new payment
     * @param paymentId Payment ID
     * @returns Success status
     */
    static notifyNewPayment(paymentId) {
        try {
            if (!WebsocketService.isInitialized) {
                logger_1.logger.warn('WebSocket server not initialized for new payment notification');
                return false;
            }
            const result = WebsocketService.sendToAdmins('new_payment', {
                payment_id: paymentId,
                message: `New payment (ID: ${paymentId}) is awaiting verification`,
                timestamp: new Date().toISOString()
            });
            if (result) {
                logger_1.logger.debug(`Notified admins about new payment ${paymentId}`);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error in notifyNewPayment for payment ${paymentId}:`, error);
            return false;
        }
    }
    /**
     * Notify user about payment verification
     * @param paymentId Payment ID
     * @param bookingId Booking ID
     * @returns Success status
     */
    static notifyPaymentVerified(paymentId, bookingId) {
        try {
            return WebsocketService.notifyPaymentStatusChange(paymentId, 'verified');
        }
        catch (error) {
            logger_1.logger.error(`Error in notifyPaymentVerified for payment ${paymentId}:`, error);
            return false;
        }
    }
    /**
     * Notify user about payment rejection
     * @param paymentId Payment ID
     * @param bookingId Booking ID
     * @param reason Rejection reason
     * @returns Success status
     */
    static notifyPaymentRejected(paymentId, bookingId, reason) {
        try {
            if (!WebsocketService.isInitialized) {
                logger_1.logger.warn('WebSocket server not initialized for payment rejection notification');
                return false;
            }
            const result = WebsocketService.safeEmit(WebsocketService.io, 'payment_rejected', {
                payment_id: paymentId,
                booking_id: bookingId,
                reason: reason || 'Payment verification failed',
                timestamp: new Date().toISOString()
            });
            if (result) {
                logger_1.logger.debug(`Notified payment rejection for ${paymentId}, booking ${bookingId}`);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error in notifyPaymentRejected for payment ${paymentId}:`, error);
            return false;
        }
    }
    /**
     * Notify about booking update
     * @param bookingId Booking ID
     * @param status New status
     * @returns Success status
     */
    static notifyBookingUpdate(bookingId, status) {
        try {
            return WebsocketService.notifyBookingStatusChange(bookingId, status);
        }
        catch (error) {
            logger_1.logger.error(`Error in notifyBookingUpdate for booking ${bookingId}:`, error);
            return false;
        }
    }
    /**
     * Register socket connection handlers
     */
    static registerHandlers() {
        if (!WebsocketService.isInitialized) {
            logger_1.logger.warn('WebSocket server not initialized for registering handlers');
            return;
        }
        WebsocketService.io.on('connection', (socket) => {
            logger_1.logger.info(`Socket connected: ${socket.id}`);
            // Join event room
            socket.on('join_event', (eventId) => {
                try {
                    socket.join(`event:${eventId}`);
                    logger_1.logger.debug(`Socket ${socket.id} joined event room: ${eventId}`);
                }
                catch (error) {
                    logger_1.logger.error(`Error joining event room ${eventId}:`, error);
                }
            });
            // Join user room
            socket.on('authenticate', (userId) => {
                try {
                    // Add validation here in a real app
                    if (!userId || typeof userId !== 'string') {
                        logger_1.logger.warn(`Invalid user ID for authentication: ${userId}`);
                        return;
                    }
                    socket.join(`user:${userId}`);
                    logger_1.logger.debug(`Socket ${socket.id} authenticated as user: ${userId}`);
                }
                catch (error) {
                    logger_1.logger.error(`Error authenticating user socket:`, error);
                }
            });
            // Join admin room
            socket.on('admin_auth', (adminToken) => {
                try {
                    // In a real application, you would validate the admin token
                    // For now, just join the admin room
                    socket.join('admin');
                    logger_1.logger.debug(`Socket ${socket.id} joined admin room`);
                }
                catch (error) {
                    logger_1.logger.error(`Error authenticating admin socket:`, error);
                }
            });
            // Leave event room
            socket.on('leave_event', (eventId) => {
                try {
                    socket.leave(`event:${eventId}`);
                    logger_1.logger.debug(`Socket ${socket.id} left event room: ${eventId}`);
                }
                catch (error) {
                    logger_1.logger.error(`Error leaving event room ${eventId}:`, error);
                }
            });
            // Handle disconnect
            socket.on('disconnect', () => {
                logger_1.logger.info(`Socket disconnected: ${socket.id}`);
            });
            // Handle errors
            socket.on('error', (error) => {
                logger_1.logger.error(`Socket ${socket.id} error:`, error);
            });
        });
    }
    /**
     * Check if the WebSocket service is initialized
     */
    static isServiceInitialized() {
        return WebsocketService.isInitialized;
    }
}
exports.WebsocketService = WebsocketService;
