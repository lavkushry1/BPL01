"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBooking = exports.updateBookingStatus = exports.saveDeliveryDetails = exports.getBookingById = exports.getUserBookings = exports.createBooking = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../db");
const seat_1 = require("../models/seat");
const websocket_service_1 = require("../services/websocket.service");
const apiError_1 = require("../utils/apiError");
const asyncHandler_1 = require("../utils/asyncHandler");
/**
 * Create a new booking
 */
const booking_validation_1 = require("@/validations/booking.validation");
const apiResponse_1 = require("../utils/apiResponse");
/**
 * Create a new booking
 */
exports.createBooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { body: validatedData } = booking_validation_1.createBookingSchema.parse({ body: req.body });
        const { event_id, seat_ids, amount } = validatedData;
        const user_id = req.user?.id;
        if (!user_id) {
            throw apiError_1.ApiError.unauthorized('User not authenticated');
        }
        // Process booking with transaction to ensure data integrity
        const newBooking = await db_1.db.transaction(async (trx) => {
            // 1. Check if event exists
            const event = await trx('events')
                .select('id')
                .where('id', event_id)
                .forUpdate() // Lock the event row
                .first();
            if (!event) {
                throw apiError_1.ApiError.notFound('Event not found');
            }
            // 2. Create booking record
            const booking_id = (0, uuid_1.v4)();
            const [booking] = await trx('bookings')
                .insert({
                id: booking_id,
                event_id,
                user_id,
                final_amount: amount,
                status: 'PENDING',
                createdAt: trx.fn.now(),
                updatedAt: trx.fn.now()
            })
                .returning('*');
            // 4. Handle Seats or General Admission
            if (seat_ids && seat_ids.length > 0) {
                // Pessimistically lock requested seats to prevent double booking
                const seats = await trx('seats')
                    .whereIn('id', seat_ids)
                    .forUpdate()
                    .select('id', 'status');
                if (seats.length !== seat_ids.length) {
                    throw apiError_1.ApiError.badRequest('One or more seats were not found');
                }
                const unavailableSeats = seats.filter(seat => seat.status !== seat_1.SeatStatus.AVAILABLE);
                if (unavailableSeats.length > 0) {
                    throw apiError_1.ApiError.conflict('One or more seats are no longer available', 'SEAT_NOT_AVAILABLE', { unavailableSeats: unavailableSeats.map(s => s.id) });
                }
                // Update seat status to booked
                await trx('seats')
                    .update({
                    status: seat_1.SeatStatus.BOOKED,
                    booking_id: booking_id,
                    updatedAt: trx.fn.now()
                })
                    .whereIn('id', seat_ids);
                // Notify other clients that seats have been booked
                websocket_service_1.WebsocketService.notifySeatStatusChange(seat_ids, seat_1.SeatStatus.BOOKED);
            }
            return booking;
        });
        return apiResponse_1.ApiResponse.created(res, newBooking, 'Booking created successfully');
    }
    catch (error) {
        console.error('CRITICAL DEBUG - createBooking error:', error);
        throw error;
    }
});
/**
 * Get all bookings for the authenticated user
 */
exports.getUserBookings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw apiError_1.ApiError.unauthorized('User not authenticated');
        }
        const bookings = await (0, db_1.db)('bookings')
            .select('id', 'event_id', 'user_id', 'status', 'createdAt', 'updatedAt')
            .where('user_id', userId)
            .orderBy('createdAt', 'desc');
        return apiResponse_1.ApiResponse.success(res, 200, 'Bookings fetched successfully', bookings);
    }
    catch (error) {
        throw error;
    }
});
/**
 * Get booking by ID
 */
exports.getBookingById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Get booking details
    const booking = await (0, db_1.db)('bookings')
        .select('id', 'event_id', 'user_id', 'status', 'createdAt', 'updatedAt')
        .where('id', id)
        .first();
    if (!booking) {
        throw apiError_1.ApiError.notFound('Booking not found');
    }
    // User can only view their own bookings unless they're an admin
    const userId = req.user?.id;
    if (booking.user_id !== userId && req.user?.role !== 'ADMIN') {
        throw apiError_1.ApiError.forbidden('You are not authorized to view this booking');
    }
    return apiResponse_1.ApiResponse.success(res, 200, 'Booking fetched successfully', booking);
});
/**
 * Save delivery details
 */
exports.saveDeliveryDetails = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { body: validatedData } = booking_validation_1.saveDeliveryDetailsSchema.parse({ body: req.body });
    const { booking_id, name, phone, address, city, pincode } = validatedData;
    // Check if booking exists
    const booking = await (0, db_1.db)('bookings')
        .select('id')
        .where('id', booking_id)
        .first();
    if (!booking) {
        throw apiError_1.ApiError.notFound('Booking not found');
    }
    // Use transaction to ensure atomicity
    const [deliveryDetails] = await db_1.db.transaction(async (trx) => {
        // Check if delivery details already exist
        const existingDetails = await trx('delivery_details')
            .where('booking_id', booking_id)
            .first();
        if (existingDetails) {
            // Update existing details
            return await trx('delivery_details')
                .where('booking_id', booking_id)
                .update({
                name,
                phone,
                address,
                city,
                pincode,
                updatedAt: trx.fn.now()
            })
                .returning('*');
        }
        else {
            // Create new delivery details
            return await trx('delivery_details')
                .insert({
                id: (0, uuid_1.v4)(),
                booking_id,
                name,
                phone,
                address,
                city,
                pincode,
                createdAt: trx.fn.now(),
                updatedAt: trx.fn.now()
            })
                .returning('*');
        }
    });
    return apiResponse_1.ApiResponse.created(res, deliveryDetails, 'Delivery details saved successfully');
});
/**
 * Update booking status
 */
exports.updateBookingStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { body: { status } } = booking_validation_1.updateBookingStatusSchema.parse({ params: req.params, body: req.body });
    // Check if booking exists
    const booking = await (0, db_1.db)('bookings')
        .select('id')
        .where('id', id)
        .first();
    if (!booking) {
        throw apiError_1.ApiError.notFound('Booking not found');
    }
    // Update booking status
    const [updatedBooking] = await (0, db_1.db)('bookings')
        .where('id', id)
        .update({
        status,
        updatedAt: db_1.db.fn.now()
    })
        .returning('*');
    return apiResponse_1.ApiResponse.success(res, 200, 'Booking status updated successfully', updatedBooking);
});
/**
 * Cancel booking
 */
exports.cancelBooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const {} = booking_validation_1.cancelBookingSchema.parse({ params: req.params, body: req.body });
    // Check if booking exists
    const booking = await (0, db_1.db)('bookings')
        .select('*')
        .where('id', id)
        .first();
    if (!booking) {
        throw apiError_1.ApiError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }
    // User can only cancel their own bookings unless they're an admin
    const userId = req.user?.id;
    if (booking.user_id !== userId && req.user?.role !== 'ADMIN') {
        throw apiError_1.ApiError.forbidden('You are not authorized to cancel this booking');
    }
    // Validate cancellation is allowed
    if (booking.status === 'CANCELLED') {
        throw apiError_1.ApiError.badRequest('Booking already cancelled', 'ALREADY_CANCELLED');
    }
    // Check if event date is within cancellation period
    // This would need to be adapted based on your schema
    let eventCanBeCancelled = true;
    if (booking.event_id) {
        const event = await (0, db_1.db)('events')
            .select('start_date')
            .where('id', booking.event_id)
            .first();
        if (event && event.start_date) {
            const now = new Date();
            const eventDate = new Date(event.start_date);
            const hoursTillEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursTillEvent < 24) {
                eventCanBeCancelled = false;
            }
        }
    }
    if (!eventCanBeCancelled) {
        throw new apiError_1.ApiError(400, 'Cannot cancel bookings less than 24 hours before event', 'CANCELLATION_PERIOD_EXPIRED');
    }
    // Use transaction for all related updates
    const result = await db_1.db.transaction(async (trx) => {
        // Update booking status
        const [cancelledBooking] = await trx('bookings')
            .where('id', id)
            .update({
            status: 'CANCELLED',
            updatedAt: trx.fn.now()
        })
            .returning('*');
        // Get booked seats
        const bookedSeats = await trx('booked_seats')
            .select('seat_id')
            .where('booking_id', id);
        const seatIds = bookedSeats.map((bs) => bs.seat_id);
        if (seatIds.length > 0) {
            // Release seats
            await trx('seats')
                .whereIn('id', seatIds)
                .update({
                status: 'AVAILABLE',
                updatedAt: trx.fn.now()
            });
        }
        // Check for payment associated with this booking
        const payment = await trx('booking_payments')
            .select('id', 'status')
            .where('booking_id', id)
            .first();
        // If payment exists and was verified, mark for refund
        let paymentRefunded = false;
        if (payment && payment.status === 'verified') {
            await trx('booking_payments')
                .where('id', payment.id)
                .update({
                status: 'refunded',
                updatedAt: trx.fn.now()
            })
                .returning('*');
            paymentRefunded = true;
        }
        return {
            cancelledBooking,
            paymentRefunded
        };
    });
    // Notify through WebSocket if available
    try {
        websocket_service_1.WebsocketService.notifyBookingUpdate(id, 'cancelled');
    }
    catch (error) {
    }
    return apiResponse_1.ApiResponse.success(res, 200, 'Booking cancelled successfully', {
        booking_id: result.cancelledBooking.id,
        status: result.cancelledBooking.status,
        cancelled_at: result.cancelledBooking.cancelled_at,
        refund_status: result.paymentRefunded ? 'initiated' : 'not_applicable'
    });
});
//# sourceMappingURL=booking.controller.js.map