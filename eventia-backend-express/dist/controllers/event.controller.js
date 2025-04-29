"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const apiError_1 = require("../utils/apiError");
const db_1 = require("../db");
const uuid_1 = require("uuid");
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
/**
 * Controller for handling event operations
 */
class EventController {
    /**
     * Get all events with optional filtering
     * @route GET /api/events
     */
    static getAllEvents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            // Parse query parameters for filtering
            const { category, date, page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = req.query;
            // Calculate offset for pagination
            const offset = (Number(page) - 1) * Number(limit);
            // Build the query
            let query = (0, db_1.db)('events')
                .select('events.*', db_1.db.raw('COALESCE(JSON_AGG(DISTINCT event_images.*) FILTER (WHERE event_images.id IS NOT NULL), \'[]\') as images'), db_1.db.raw('COALESCE(JSON_AGG(DISTINCT ticket_types.*) FILTER (WHERE ticket_types.id IS NOT NULL), \'[]\') as ticket_types'))
                .leftJoin('event_images', 'events.id', 'event_images.event_id')
                .leftJoin('ticket_types', 'events.id', 'ticket_types.event_id')
                .groupBy('events.id')
                .orderBy(sort_by.toString(), sort_order === 'asc' ? 'asc' : 'desc')
                .limit(Number(limit))
                .offset(offset);
            // Add filters if provided
            if (category) {
                query = query.where('events.category', category);
            }
            if (date) {
                // Assuming date format is YYYY-MM-DD
                query = query.whereRaw('DATE(events.start_date) = ?', [date]);
            }
            // Execute the query
            const events = await query;
            // Get total count for pagination
            const countResult = await (0, db_1.db)('events')
                .count('id as count')
                .first();
            const total = Number(countResult?.count || 0);
            return apiResponse_1.ApiResponse.success(res, 200, 'Events fetched successfully', {
                events,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    total_pages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching events:', error);
            throw new apiError_1.ApiError(500, 'Failed to fetch events', 'EVENTS_FETCH_FAILED');
        }
    });
    /**
     * Get event by ID
     * @route GET /api/events/:id
     */
    static getEventById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        try {
            // Get event with related data
            const event = await (0, db_1.db)('events')
                .select('events.*', db_1.db.raw('COALESCE(JSON_AGG(DISTINCT event_images.*) FILTER (WHERE event_images.id IS NOT NULL), \'[]\') as images'), db_1.db.raw('COALESCE(JSON_AGG(DISTINCT ticket_types.*) FILTER (WHERE ticket_types.id IS NOT NULL), \'[]\') as ticket_types'), db_1.db.raw('to_json(venues.*) as venue'))
                .leftJoin('event_images', 'events.id', 'event_images.event_id')
                .leftJoin('ticket_types', 'events.id', 'ticket_types.event_id')
                .leftJoin('venues', 'events.venue_id', 'venues.id')
                .where('events.id', id)
                .groupBy('events.id', 'venues.id')
                .first();
            if (!event) {
                throw new apiError_1.ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
            }
            return apiResponse_1.ApiResponse.success(res, 200, 'Event fetched successfully', event);
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            logger_1.logger.error(`Error fetching event with ID ${id}:`, error);
            throw new apiError_1.ApiError(500, 'Failed to fetch event details', 'EVENT_FETCH_FAILED');
        }
    });
    /**
     * Create a new event (Admin only)
     * @route POST /api/admin/events
     */
    static createEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { title, description, start_date, end_date, venue_id, category, has_seat_map, seat_map_id, ticket_types, images } = req.body;
        // Validate required fields
        if (!title || !start_date || !venue_id) {
            throw new apiError_1.ApiError(400, 'Title, start date, and venue are required', 'MISSING_REQUIRED_FIELDS');
        }
        try {
            // Use transaction to ensure data consistency
            const result = await db_1.db.transaction(async (trx) => {
                // Create event
                const eventId = (0, uuid_1.v4)();
                await trx('events').insert({
                    id: eventId,
                    title,
                    description,
                    start_date,
                    end_date: end_date || start_date, // Default end date to start date if not provided
                    venue_id,
                    category,
                    has_seat_map: has_seat_map || false,
                    seat_map_id,
                    created_at: trx.fn.now(),
                    updated_at: trx.fn.now()
                });
                // Add ticket types if provided
                if (ticket_types && Array.isArray(ticket_types) && ticket_types.length > 0) {
                    const ticketTypesWithIds = ticket_types.map((type) => ({
                        id: (0, uuid_1.v4)(),
                        event_id: eventId,
                        name: type.name,
                        description: type.description,
                        price: type.price,
                        quantity: type.quantity,
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now()
                    }));
                    await trx('ticket_types').insert(ticketTypesWithIds);
                }
                // Add images if provided
                if (images && Array.isArray(images) && images.length > 0) {
                    const imagesWithIds = images.map((image, index) => ({
                        id: (0, uuid_1.v4)(),
                        event_id: eventId,
                        url: image.url,
                        alt_text: image.alt_text || title,
                        is_featured: image.is_featured || index === 0, // First image is featured by default
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now()
                    }));
                    await trx('event_images').insert(imagesWithIds);
                }
                // Get the created event with related data
                const createdEvent = await trx('events')
                    .select('events.*', db_1.db.raw('COALESCE(JSON_AGG(DISTINCT event_images.*) FILTER (WHERE event_images.id IS NOT NULL), \'[]\') as images'), db_1.db.raw('COALESCE(JSON_AGG(DISTINCT ticket_types.*) FILTER (WHERE ticket_types.id IS NOT NULL), \'[]\') as ticket_types'))
                    .leftJoin('event_images', 'events.id', 'event_images.event_id')
                    .leftJoin('ticket_types', 'events.id', 'ticket_types.event_id')
                    .where('events.id', eventId)
                    .groupBy('events.id')
                    .first();
                return createdEvent;
            });
            return apiResponse_1.ApiResponse.success(res, 201, 'Event created successfully', result);
        }
        catch (error) {
            logger_1.logger.error('Error creating event:', error);
            throw new apiError_1.ApiError(500, 'Failed to create event', 'EVENT_CREATION_FAILED');
        }
    });
    /**
     * Update an event (Admin only)
     * @route PUT /api/admin/events/:id
     */
    static updateEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const eventData = req.body;
        try {
            // Check if event exists
            const existingEvent = await (0, db_1.db)('events')
                .where({ id })
                .first();
            if (!existingEvent) {
                throw new apiError_1.ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
            }
            // Update the event
            await db_1.db.transaction(async (trx) => {
                // Update event basic details
                await trx('events')
                    .where({ id })
                    .update({
                    ...eventData,
                    updated_at: trx.fn.now()
                });
                // Update ticket types if provided
                if (eventData.ticket_types && Array.isArray(eventData.ticket_types)) {
                    // Remove existing ticket types to replace them
                    await trx('ticket_types')
                        .where({ event_id: id })
                        .delete();
                    // Add new ticket types
                    if (eventData.ticket_types.length > 0) {
                        const ticketTypesWithIds = eventData.ticket_types.map((type) => ({
                            id: type.id || (0, uuid_1.v4)(),
                            event_id: id,
                            name: type.name,
                            description: type.description,
                            price: type.price,
                            quantity: type.quantity,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        }));
                        await trx('ticket_types').insert(ticketTypesWithIds);
                    }
                }
                // Update images if provided
                if (eventData.images && Array.isArray(eventData.images)) {
                    // Remove existing images to replace them
                    await trx('event_images')
                        .where({ event_id: id })
                        .delete();
                    // Add new images
                    if (eventData.images.length > 0) {
                        const imagesWithIds = eventData.images.map((image, index) => ({
                            id: image.id || (0, uuid_1.v4)(),
                            event_id: id,
                            url: image.url,
                            alt_text: image.alt_text || eventData.title || existingEvent.title,
                            is_featured: image.is_featured || index === 0,
                            created_at: trx.fn.now(),
                            updated_at: trx.fn.now()
                        }));
                        await trx('event_images').insert(imagesWithIds);
                    }
                }
            });
            // Get the updated event with related data
            const updatedEvent = await (0, db_1.db)('events')
                .select('events.*', db_1.db.raw('COALESCE(JSON_AGG(DISTINCT event_images.*) FILTER (WHERE event_images.id IS NOT NULL), \'[]\') as images'), db_1.db.raw('COALESCE(JSON_AGG(DISTINCT ticket_types.*) FILTER (WHERE ticket_types.id IS NOT NULL), \'[]\') as ticket_types'))
                .leftJoin('event_images', 'events.id', 'event_images.event_id')
                .leftJoin('ticket_types', 'events.id', 'ticket_types.event_id')
                .where('events.id', id)
                .groupBy('events.id')
                .first();
            return apiResponse_1.ApiResponse.success(res, 200, 'Event updated successfully', updatedEvent);
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            logger_1.logger.error(`Error updating event with ID ${id}:`, error);
            throw new apiError_1.ApiError(500, 'Failed to update event', 'EVENT_UPDATE_FAILED');
        }
    });
    /**
     * Delete an event (Admin only)
     * @route DELETE /api/admin/events/:id
     */
    static deleteEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        try {
            // Check if event exists
            const existingEvent = await (0, db_1.db)('events')
                .where({ id })
                .first();
            if (!existingEvent) {
                throw new apiError_1.ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
            }
            // Delete the event and related data
            await db_1.db.transaction(async (trx) => {
                // Delete ticket types
                await trx('ticket_types')
                    .where({ event_id: id })
                    .delete();
                // Delete images
                await trx('event_images')
                    .where({ event_id: id })
                    .delete();
                // Delete the event
                await trx('events')
                    .where({ id })
                    .delete();
            });
            return apiResponse_1.ApiResponse.success(res, 200, 'Event deleted successfully');
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            logger_1.logger.error(`Error deleting event with ID ${id}:`, error);
            throw new apiError_1.ApiError(500, 'Failed to delete event', 'EVENT_DELETE_FAILED');
        }
    });
    /**
     * Get all seats for an event
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     * @returns {Promise<Response>} - Returns event seats
     */
    static getEventSeats = async (req, res) => {
        try {
            const { id } = req.params;
            // Verify event exists
            const event = await (0, db_1.db)('events').where('id', id).first();
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }
            // Get all seats for this event
            const seats = await (0, db_1.db)('seats')
                .where('eventId', id)
                .select('id', 'label', 'section', 'row', 'seatNumber', 'status', 'price', 'eventId', db_1.db.raw('CASE WHEN lock_expires_at > NOW() THEN locked_by ELSE NULL END as locked_by'), db_1.db.raw('CASE WHEN lock_expires_at > NOW() THEN lock_expires_at ELSE NULL END as lock_expires_at'));
            // Group seats by section for easier frontend consumption
            const seatsBySection = seats.reduce((acc, seat) => {
                if (!acc[seat.section]) {
                    acc[seat.section] = [];
                }
                acc[seat.section].push(seat);
                return acc;
            }, {});
            return res.status(200).json({
                success: true,
                data: {
                    event_id: id,
                    sections: Object.keys(seatsBySection),
                    seats: seatsBySection
                }
            });
        }
        catch (error) {
            console.error('Error fetching event seats:', error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching event seats'
            });
        }
    };
}
exports.EventController = EventController;
