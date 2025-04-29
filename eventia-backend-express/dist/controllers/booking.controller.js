"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBooking = exports.updateBookingStatus = exports.saveDeliveryDetails = exports.getBookingById = exports.createBooking = void 0;
const apiError_1 = require("../utils/apiError");
const db_1 = require("../db");
const uuid_1 = require("uuid");
const asyncHandler_1 = require("../utils/asyncHandler");
const websocket_service_1 = require("../services/websocket.service");
const seat_1 = require("../models/seat");
/**
 * Create a new booking
 */
exports.createBooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { event_id, user_id, seat_ids, amount, payment_method } = req.body;
    // Validate required fields
    if (!event_id || !user_id || !amount || !payment_method) {
        throw apiError_1.ApiError.badRequest('Missing required booking information');
    }
    // Check if event exists and has enough capacity
    const event = await (0, db_1.db)('events')
        .select('id', 'capacity', 'booked_count')
        .where('id', event_id)
        .first();
    if (!event) {
        throw apiError_1.ApiError.notFound('Event not found');
    }
    // Process booking with transaction to ensure data integrity
    const newBooking = await db_1.db.transaction(async (trx) => {
        // Create booking record
        const booking_id = (0, uuid_1.v4)();
        const [booking] = await trx('bookings')
            .insert({
            id: booking_id,
            event_id,
            user_id,
            amount,
            payment_method,
            status: 'PENDING',
            created_at: trx.fn.now(),
            updated_at: trx.fn.now()
        })
            .returning('*');
        // If seat_ids are provided, reserve those seats
        if (seat_ids && seat_ids.length > 0) {
            const seats = { seat_ids, booking_id };
            // Update seat status to booked
            await trx('seats')
                .update({
                status: seat_1.SeatStatus.BOOKED,
                booking_id: booking_id,
                updated_at: trx.fn.now()
            })
                .whereIn('id', seats.seat_ids);
            // Notify other clients that seats have been booked
            websocket_service_1.WebsocketService.notifySeatStatusChange(seats.seat_ids, seat_1.SeatStatus.BOOKED);
        }
        return booking;
    });
    return res.status(201).json({
        status: 'success',
        data: newBooking
    });
});
/**
 * Get booking by ID
 */
exports.getBookingById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate booking ID
    if (!id) {
        throw apiError_1.ApiError.badRequest('Booking ID is required');
    }
    // Get booking details
    const booking = await (0, db_1.db)('bookings')
        .select('*')
        .where('id', id)
        .first();
    if (!booking) {
        throw apiError_1.ApiError.notFound('Booking not found');
    }
    return res.status(200).json({
        status: 'success',
        data: booking
    });
});
/**
 * Save delivery details
 */
exports.saveDeliveryDetails = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { booking_id, name, phone, address, city, pincode } = req.body;
    // Validate required fields
    if (!booking_id || !name || !phone || !address || !city || !pincode) {
        throw apiError_1.ApiError.badRequest('Missing required delivery details');
    }
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
                updated_at: trx.fn.now()
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
                created_at: trx.fn.now(),
                updated_at: trx.fn.now()
            })
                .returning('*');
        }
    });
    return res.status(201).json({
        status: 'success',
        data: deliveryDetails
    });
});
/**
 * Update booking status
 */
exports.updateBookingStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    // Validate required fields
    if (!id || !status) {
        throw apiError_1.ApiError.badRequest('Booking ID and status are required');
    }
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
        updated_at: db_1.db.fn.now()
    })
        .returning('*');
    return res.status(200).json({
        status: 'success',
        data: updatedBooking
    });
});
/**
 * Cancel booking
 */
exports.cancelBooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    // Check if booking exists
    const booking = await (0, db_1.db)('bookings')
        .select('*')
        .where('id', id)
        .first();
    if (!booking) {
        throw apiError_1.ApiError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
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
            cancelled_at: new Date(),
            cancellation_reason: cancellation_reason || 'User requested cancellation',
            updated_at: trx.fn.now()
        })
            .returning('*');
        // Update seats to available
        await trx('seats')
            .where('booking_id', id)
            .update({
            status: 'available',
            booking_id: null,
            updated_at: trx.fn.now()
        });
        // If payment exists, mark for refund if it was verified
        const payment = await trx('booking_payments')
            .where('booking_id', id)
            .where('status', 'verified')
            .first();
        let paymentUpdate = null;
        if (payment) {
            [paymentUpdate] = await trx('booking_payments')
                .where('id', payment.id)
                .update({
                status: 'refunded',
                refunded_at: new Date(),
                notes: 'Booking cancelled by user, automatic refund initiated',
                updated_at: trx.fn.now()
            })
                .returning('*');
        }
        return {
            cancelledBooking,
            paymentRefunded: !!paymentUpdate
        };
    });
    // Notify through WebSocket if available
    try {
        websocket_service_1.WebsocketService.notifyBookingUpdate(id, 'cancelled');
    }
    catch (wsError) {
        // Log WebSocket error but don't fail the request
        console.error('WebSocket notification failed:', wsError);
    }
    return res.status(200).json({
        status: 'success',
        message: 'Booking cancelled successfully',
        data: {
            booking_id: result.cancelledBooking.id,
            status: result.cancelledBooking.status,
            cancelled_at: result.cancelledBooking.cancelled_at,
            refund_status: result.paymentRefunded ? 'initiated' : 'not_applicable'
        }
    });
});
