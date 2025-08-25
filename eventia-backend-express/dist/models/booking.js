"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingModel = exports.deliveryDetailsSchema = exports.bookingSchema = void 0;
const zod_1 = require("zod");
const db_1 = require("../db");
// Booking schema for validation
exports.bookingSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    event_id: zod_1.z.string().uuid(),
    seats: zod_1.z.array(zod_1.z.string()).min(1, 'At least one seat is required'),
    total_amount: zod_1.z.number().positive(),
    discount_applied: zod_1.z.number().min(0).optional(),
    final_amount: zod_1.z.number().positive(),
    status: zod_1.z.enum(['pending', 'confirmed', 'cancelled']),
});
// Delivery details schema
exports.deliveryDetailsSchema = zod_1.z.object({
    booking_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1, 'Name is required'),
    phone: zod_1.z.string().min(10, 'Phone number must be at least 10 characters'),
    address: zod_1.z.string().min(1, 'Address is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    pincode: zod_1.z.string().min(1, 'Pincode is required'),
});
class BookingModel {
    /**
     * Create a new booking
     */
    static async create(data) {
        const [booking] = await (0, db_1.db)('bookings')
            .insert({
            user_id: data.user_id,
            event_id: data.event_id,
            seats: JSON.stringify(data.seats),
            total_amount: data.total_amount,
            discount_applied: data.discount_applied,
            final_amount: data.final_amount,
            status: data.status || 'pending',
            booking_date: new Date(),
        })
            .returning('*');
        return {
            ...booking,
            seats: JSON.parse(booking.seats),
        };
    }
    /**
     * Get booking by ID
     */
    static async getById(id) {
        const booking = await (0, db_1.db)('bookings')
            .select('*')
            .where({ id })
            .first();
        if (!booking)
            return null;
        return {
            ...booking,
            seats: JSON.parse(booking.seats),
        };
    }
    /**
     * Get bookings by user ID
     */
    static async getByUserId(userId) {
        const bookings = await (0, db_1.db)('bookings')
            .select('*')
            .where({ user_id: userId })
            .orderBy('created_at', 'desc');
        return bookings.map((booking) => ({
            ...booking,
            seats: JSON.parse(booking.seats),
        }));
    }
    /**
     * Get bookings by event ID
     */
    static async getByEventId(eventId) {
        const bookings = await (0, db_1.db)('bookings')
            .select('*')
            .where({ event_id: eventId })
            .orderBy('created_at', 'desc');
        return bookings.map((booking) => ({
            ...booking,
            seats: JSON.parse(booking.seats),
        }));
    }
    /**
     * Update booking status
     */
    static async updateStatus(id, status) {
        const [booking] = await (0, db_1.db)('bookings')
            .update({
            status,
            updated_at: new Date(),
        })
            .where({ id })
            .returning('*');
        return {
            ...booking,
            seats: JSON.parse(booking.seats),
        };
    }
    /**
     * Add delivery details to a booking
     */
    static async addDeliveryDetails(data) {
        const [deliveryDetails] = await (0, db_1.db)('delivery_details')
            .insert(data)
            .returning('*');
        return deliveryDetails;
    }
    /**
     * Get delivery details by booking ID
     */
    static async getDeliveryDetailsByBookingId(bookingId) {
        const deliveryDetails = await (0, db_1.db)('delivery_details')
            .select('*')
            .where({ booking_id: bookingId })
            .first();
        return deliveryDetails || null;
    }
    /**
     * Get all bookings with pagination
     */
    static async getAll(page = 1, limit = 10, status) {
        const query = (0, db_1.db)('bookings').select('*');
        if (status) {
            query.where({ status });
        }
        const offset = (page - 1) * limit;
        const [bookingsResult, countResult] = await Promise.all([
            query.clone().offset(offset).limit(limit).orderBy('created_at', 'desc'),
            query.clone().count('* as count').first()
        ]);
        const bookings = bookingsResult.map((booking) => ({
            ...booking,
            seats: JSON.parse(booking.seats),
        }));
        return {
            bookings,
            total: Number(countResult?.count || 0)
        };
    }
}
exports.BookingModel = BookingModel;
//# sourceMappingURL=booking.js.map