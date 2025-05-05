import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { SeatStatus } from '../models/seat';
import { logger } from '../utils/logger';
import config from '../config';

/**
 * WebSocket service for real-time notifications and updates
 * Handles seat status changes, payment notifications, and other real-time events
 */
export class WebsocketService {
  private static io: SocketServer | null = null;
  private static userSockets: Map<string, string[]> = new Map(); // userId -> socketIds
  private static adminSockets: Set<string> = new Set(); // socketIds of admin users
  private static connectedClients: number = 0;

  /**
   * Initialize the WebSocket server
   * @param server HTTP server instance
   */
  static initialize(server: Server): void {
    try {
      this.io = new SocketServer(server, {
        cors: {
          origin: config.frontendUrl,
          methods: ['GET', 'POST'],
          credentials: true
        },
        path: '/ws'
      });

      this.setupConnectionHandlers();
      logger.info('WebSocket server initialized');
    } catch (error) {
      logger.error('Failed to initialize WebSocket server:', error);
    }
  }

  /**
   * Set up connection and event handlers
   */
  private static setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      this.connectedClients++;
      logger.debug(`Client connected: ${socket.id}. Total clients: ${this.connectedClients}`);

      // Authenticate user and register their socket
      socket.on('authenticate', (data: { userId: string; role?: string }) => {
        if (!data.userId) return;

        // Add socket to user mapping
        const userSockets = this.userSockets.get(data.userId) || [];
        userSockets.push(socket.id);
        this.userSockets.set(data.userId, userSockets);

        // Join user-specific room
        socket.join(`user:${data.userId}`);

        // If admin, add to admin list
        if (data.role === 'admin' || data.role === 'staff') {
          this.adminSockets.add(socket.id);
          socket.join('admins');
        }

        logger.debug(`User ${data.userId} authenticated on socket ${socket.id}`);
      });

      // Subscribe to specific event's updates
      socket.on('join:event', (eventId: string) => {
        if (!eventId) return;
        socket.join(`event:${eventId}`);
        logger.debug(`Socket ${socket.id} joined event ${eventId}`);
      });

      // Subscribe to booking updates
      socket.on('join:booking', (bookingId: string) => {
        if (!bookingId) return;
        socket.join(`booking:${bookingId}`);
        logger.debug(`Socket ${socket.id} joined booking ${bookingId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedClients--;
        logger.debug(`Client disconnected: ${socket.id}. Total clients: ${this.connectedClients}`);

        // Remove from admin list if applicable
        this.adminSockets.delete(socket.id);

        // Remove from user mapping
        for (const [userId, sockets] of this.userSockets.entries()) {
          const index = sockets.indexOf(socket.id);
          if (index !== -1) {
            sockets.splice(index, 1);
            if (sockets.length === 0) {
              this.userSockets.delete(userId);
            } else {
              this.userSockets.set(userId, sockets);
            }
            break;
          }
        }
      });
    });
  }

  /**
   * Notify clients about seat status changes
   * @param seatIds Array of seat IDs that were updated
   * @param status New seat status
   * @param eventId Optional event ID to specify which event room to notify
   */
  static notifySeatStatusChange(
    seatIds: string[],
    status: string,
    eventId?: string
  ): void {
    if (!this.io || seatIds.length === 0) return;

    try {
      // If we have an eventId, use broadcastSeatUpdate
      if (eventId) {
        this.broadcastSeatUpdate(eventId, seatIds, status);
        return;
      }

      // Global broadcast if no eventId is provided
      this.io.emit('seat_status_changed', {
        seat_ids: seatIds,
        status,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Global notification of seat status change: ${seatIds.length} seats changed to ${status}`);
    } catch (error) {
      logger.error('Error sending seat status change notification:', error);
    }
  }

  /**
   * Notify about booking status updates
   * @param bookingId Booking ID
   * @param status New booking status
   * @param additionalData Any additional data to include
   */
  static notifyBookingUpdate(
    bookingId: string,
    status: string,
    additionalData?: Record<string, any>
  ): void {
    if (!this.io || !bookingId) return;

    try {
      this.io.to(`booking:${bookingId}`).emit('booking_updated', {
        booking_id: bookingId,
        status,
        ...additionalData,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Notified booking update for booking ${bookingId}, status: ${status}`);
    } catch (error) {
      logger.error(`Error notifying booking update for booking ${bookingId}:`, error);
    }
  }

  /**
   * Broadcast seat status changes to all clients subscribed to an event
   * @param eventId Event ID
   * @param seatIds Array of seat IDs that were updated
   * @param status New seat status
   * @param lockedByUserId Optional user ID who locked the seats
   */
  static broadcastSeatUpdate(
    eventId: string,
    seatIds: string[],
    status: string,
    lockedByUserId?: string
  ): void {
    if (!this.io || seatIds.length === 0) return;

    try {
      this.io.to(`event:${eventId}`).emit('seat_status_changed', {
        event_id: eventId,
        seat_ids: seatIds,
        status,
        locked_by: lockedByUserId,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Broadcast seat update for event ${eventId}: ${seatIds.length} seats changed to ${status}`);
    } catch (error) {
      logger.error('Error broadcasting seat update:', error);
    }
  }

  /**
   * Send notification to a specific user
   * @param userId User ID
   * @param event Event name
   * @param data Event data
   */
  static sendToUser(userId: string, event: string, data: any): void {
    if (!this.io || !userId) return;

    try {
      this.io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Sent ${event} to user ${userId}`);
    } catch (error) {
      logger.error(`Error sending ${event} to user ${userId}:`, error);
    }
  }

  /**
   * Send notification to all admin users
   * @param event Event name
   * @param data Event data
   */
  static sendToAdmins(event: string, data: any): void {
    if (!this.io) return;

    try {
      this.io.to('admins').emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Sent ${event} to all admins`);
    } catch (error) {
      logger.error(`Error sending ${event} to admins:`, error);
    }
  }

  /**
   * Notify about payment verification
   * @param paymentId Payment ID
   * @param bookingId Booking ID
   */
  static notifyPaymentVerified(paymentId: string, bookingId: string): void {
    if (!this.io) return;

    try {
      this.io.to(`booking:${bookingId}`).emit('payment_verified', {
        payment_id: paymentId,
        booking_id: bookingId,
        status: 'verified',
        timestamp: new Date().toISOString()
      });

      logger.debug(`Notified payment verification for booking ${bookingId}`);
    } catch (error) {
      logger.error(`Error notifying payment verification for booking ${bookingId}:`, error);
    }
  }

  /**
   * Notify about payment rejection
   * @param paymentId Payment ID
   * @param bookingId Booking ID
   * @param reason Rejection reason
   */
  static notifyPaymentRejected(paymentId: string, bookingId: string, reason?: string): void {
    if (!this.io) return;

    try {
      this.io.to(`booking:${bookingId}`).emit('payment_rejected', {
        payment_id: paymentId,
        booking_id: bookingId,
        status: 'rejected',
        reason: reason || 'Payment verification failed',
        timestamp: new Date().toISOString()
      });

      logger.debug(`Notified payment rejection for booking ${bookingId}`);
    } catch (error) {
      logger.error(`Error notifying payment rejection for booking ${bookingId}:`, error);
    }
  }

  /**
   * Notify when a booking is confirmed
   * @param bookingId Booking ID
   * @param userId User ID
   */
  static notifyBookingConfirmed(bookingId: string, userId: string): void {
    if (!this.io) return;

    try {
      // Notify the specific user
      this.sendToUser(userId, 'booking_confirmed', {
        booking_id: bookingId,
        status: 'confirmed'
      });

      // Also notify anyone in the booking room (if different clients are viewing)
      this.io.to(`booking:${bookingId}`).emit('booking_confirmed', {
        booking_id: bookingId,
        status: 'confirmed',
        timestamp: new Date().toISOString()
      });

      logger.debug(`Notified booking confirmation for booking ${bookingId} to user ${userId}`);
    } catch (error) {
      logger.error(`Error notifying booking confirmation for ${bookingId}:`, error);
    }
  }

  /**
   * Notify when tickets are generated
   * @param bookingId Booking ID
   * @param userId User ID
   * @param ticketCount Number of tickets generated
   */
  static notifyTicketsGenerated(bookingId: string, userId: string, ticketCount: number): void {
    if (!this.io) return;

    try {
      this.sendToUser(userId, 'tickets_generated', {
        booking_id: bookingId,
        ticket_count: ticketCount,
        message: `Your ${ticketCount} tickets have been generated and are ready for download.`
      });

      logger.debug(`Notified ticket generation for booking ${bookingId} to user ${userId}`);
    } catch (error) {
      logger.error(`Error notifying ticket generation for booking ${bookingId}:`, error);
    }
  }

  /**
   * Notify when a seat reservation expires
   * @param userId User ID
   * @param seatIds Seat IDs that were released
   * @param eventId Event ID
   */
  static notifySeatReservationExpired(userId: string, seatIds: string[], eventId: string): void {
    if (!this.io || !userId || seatIds.length === 0) return;

    try {
      // Notify the user about their expired reservation
      this.sendToUser(userId, 'seat_reservation_expired', {
        event_id: eventId,
        seat_ids: seatIds,
        message: 'Your seat reservation has expired. These seats are now available for others to book.'
      });

      // Also broadcast the seat status change to everyone viewing the event
      this.broadcastSeatUpdate(eventId, seatIds, SeatStatus.AVAILABLE);

      logger.debug(`Notified seat reservation expiry for user ${userId}, event ${eventId}`);
    } catch (error) {
      logger.error(`Error notifying seat reservation expiry for user ${userId}:`, error);
    }
  }

  /**
   * Get the total number of connected clients
   * @returns Number of connected clients
   */
  static getConnectedClientCount(): number {
    return this.connectedClients;
  }

  /**
   * Shutdown the WebSocket server
   */
  static shutdown(): void {
    if (!this.io) return;

    try {
      this.io.close();
      this.io = null;
      this.userSockets.clear();
      this.adminSockets.clear();
      this.connectedClients = 0;
      logger.info('WebSocket server shut down');
    } catch (error) {
      logger.error('Error shutting down WebSocket server:', error);
    }
  }

  /**
   * Emit seat status change for a single seat
   * @param eventId Event ID
   * @param seatId Seat ID that was updated
   * @param status New seat status
   */
  static emitSeatStatusChange = (
    eventId: string,
    seatId: string,
    status: string
  ): void => {
    WebsocketService.broadcastSeatUpdate(eventId, [seatId], status as SeatStatus);
  };
}