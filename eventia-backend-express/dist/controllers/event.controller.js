"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = exports.listIPLMatches = exports.getPublicEventById = exports.listPublicEvents = exports.EventController = void 0;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const http_status_1 = __importDefault(require("http-status"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../db/prisma"));
const event_service_1 = require("../services/event.service");
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const logger_1 = require("../utils/logger");
const event_validation_1 = require("../validations/event.validation");
const event_validator_1 = require("../validators/event.validator");
/**
 * Controller for handling event operations
 * Responsible for parsing requests, delegating to services, and formatting responses
 */
class EventController {
    /**
     * Get all events with optional filtering
     * @route GET /api/events
     */
    static getAllEvents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        // Parse query parameters for filtering
        const filters = EventController.parseEventFilters(req);
        // Delegate to service
        const result = await event_service_1.eventService.getAllEvents(filters);
        // Return standardized response
        return apiResponse_1.ApiResponse.success(res, 200, 'Events fetched successfully', {
            events: result.events,
            pagination: result.pagination
        });
    });
    /**
     * Get event by ID
     * @route GET /api/events/:id
     */
    static getEventById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const includeParams = req.query.include ?
            req.query.include.split(',') :
            ['ticketCategories', 'categories'];
        // Use the dataloader from request for optimized query performance
        const event = await req.loaders.eventWithIncludeLoader.load({
            id,
            include: includeParams
        });
        if (!event) {
            throw apiError_1.ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
        }
        // Get the enhanced event with seat map from the service
        const enhancedEvent = await event_service_1.eventService.getEventById(id, includeParams);
        // Return standardized response
        return apiResponse_1.ApiResponse.success(res, 200, 'Event fetched successfully', enhancedEvent);
    });
    /**
     * Create a new event (Admin only)
     * @route POST /api/admin/events
     */
    static createEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        // Get the authenticated user's ID
        const userId = req.user?.id;
        if (!userId) {
            throw apiError_1.ApiError.unauthorized('Unauthorized', 'UNAUTHORIZED');
        }
        // Validate request body
        // Validate request body
        const { error, value: validatedData } = event_validation_1.createEventSchema.validate(req.body);
        if (error) {
            throw new apiError_1.ApiError(http_status_1.default.BAD_REQUEST, error.details[0].message);
        }
        // Prepare event data from request body
        const eventData = {
            ...validatedData,
            organizerId: userId,
            // Include any relations we want in the response
            include: ['ticketCategories', 'categories', 'organizer']
        };
        // Delegate to service with transaction handling
        const createdEvent = await event_service_1.eventService.createEvent(eventData);
        // Return standardized response
        return apiResponse_1.ApiResponse.created(res, createdEvent);
    });
    /**
     * Update an existing event (Admin only)
     * @route PUT /api/admin/events/:id
     */
    static updateEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        // Get the authenticated user's ID
        const userId = req.user?.id;
        if (!userId) {
            throw apiError_1.ApiError.unauthorized('Unauthorized', 'UNAUTHORIZED');
        }
        // Validate request body
        // Validate request body
        const { error, value: validatedData } = event_validation_1.updateEventSchema.validate(req.body);
        if (error) {
            throw new apiError_1.ApiError(http_status_1.default.BAD_REQUEST, error.details[0].message);
        }
        // Prepare update data from request body
        const updateData = {
            ...validatedData,
            // Include any relations we want in the response
            include: ['ticketCategories', 'categories']
        };
        // Delegate to service
        const updatedEvent = await event_service_1.eventService.updateEvent(id, updateData);
        // Return standardized response
        return apiResponse_1.ApiResponse.success(res, 200, 'Event updated successfully', updatedEvent);
    });
    /**
     * Delete an event (Admin only)
     * @route DELETE /api/admin/events/:id
     */
    static deleteEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        // Get the authenticated user's ID
        const userId = req.user?.id;
        if (!userId) {
            throw apiError_1.ApiError.unauthorized('Unauthorized', 'UNAUTHORIZED');
        }
        // Use the dataloader to check if event exists before deletion
        const eventExists = await req.loaders.eventLoader.load(id);
        if (!eventExists) {
            throw apiError_1.ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
        }
        // Delegate to service for soft deletion
        await event_service_1.eventService.deleteEvent(id);
        // Return standardized response
        return apiResponse_1.ApiResponse.success(res, 200, 'Event deleted successfully', null);
    });
    /**
     * Get published events for public view
     * @route GET /api/public/events
     */
    static getPublishedEvents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        // Parse query parameters for filtering
        const filters = EventController.parseEventFilters(req);
        // Ensure we only return published events
        filters.status = client_1.EventStatus.PUBLISHED;
        // Support for cursor-based pagination
        if (req.query.cursor) {
            filters.cursor = req.query.cursor;
        }
        // Optionally limit fields for better performance
        if (req.query.fields) {
            filters.fields = req.query.fields.split(',');
        }
        // Delegate to service
        const result = await event_service_1.eventService.getPublishedEvents(filters);
        // Return standardized response
        return apiResponse_1.ApiResponse.success(res, 200, 'Published events fetched successfully', {
            events: result.events,
            pagination: result.pagination
        });
    });
    /**
     * Get featured events
     * @route GET /api/public/events/featured
     */
    static getFeaturedEvents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        // Delegate to service with optimized field selection
        const events = await event_service_1.eventService.getFeaturedEvents(limit);
        // Return standardized response
        return apiResponse_1.ApiResponse.success(res, 200, 'Featured events fetched successfully', { events });
    });
    /**
     * List all published events for public view
     * @route GET /api/public/events/list
     */
    static listPublicEvents = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        // Enable CORS for this endpoint
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        // Use the proper service with filters and optimized field selection
        const filters = {
            status: client_1.EventStatus.PUBLISHED,
            search: req.query.search,
            category: req.query.category,
            page: 1,
            limit: 10,
            // Only include fields needed for the listing
            fields: ['id', 'title', 'description', 'startDate', 'endDate', 'location', 'status', 'imageUrl', 'createdAt', 'updatedAt'],
            // Only include relations needed for the listing
            include: ['ticketCategories', 'categories']
        };
        // Support for cursor-based pagination
        if (req.query.cursor) {
            filters.cursor = req.query.cursor;
            delete filters.page; // Can't use both pagination methods
        }
        const result = await event_service_1.eventService.getAllEvents(filters);
        // Format events for backward compatibility
        const formattedEvents = result.events.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            start_date: event.startDate.toISOString(),
            end_date: event.endDate.toISOString(),
            location: event.location,
            status: event.status,
            images: event.imageUrl ? [{ id: 'img1', url: event.imageUrl, is_featured: true }] : [],
            ticket_types: event.ticketCategories ? event.ticketCategories.map(tc => ({
                id: tc.id,
                name: tc.name,
                price: parseFloat(tc.price.toString()),
                quantity: tc.totalSeats,
                available: tc.totalSeats - tc.bookedSeats
            })) : [],
            created_at: event.createdAt.toISOString(),
            updated_at: event.updatedAt.toISOString(),
            poster_image: event.imageUrl || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
            category: event.categories && event.categories.length > 0 ? event.categories[0].name : 'General'
        }));
        // Return successful response with pagination that supports cursor-based navigation
        const pagination = {
            ...(result.pagination.total !== undefined && { total: result.pagination.total }),
            ...(result.pagination.page !== undefined && { page: result.pagination.page }),
            limit: result.pagination.limit,
            ...(result.pagination.totalPages !== undefined && { totalPages: result.pagination.totalPages }),
            ...(result.pagination.nextCursor !== undefined && { nextCursor: result.pagination.nextCursor }),
            ...(result.pagination.hasMore !== undefined && { hasMore: result.pagination.hasMore })
        };
        return apiResponse_1.ApiResponse.success(res, 200, 'Public events listed successfully', {
            events: formattedEvents,
            pagination
        });
    });
    /**
     * Get a specific event by ID for public view
     * @route GET /api/public/events/:id
     */
    static getPublicEventById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const includeParams = ['ticketCategories', 'categories', 'organizer'];
        // Use dataloader for optimized queries
        const event = await req.loaders.eventWithIncludeLoader.load({
            id,
            include: includeParams
        });
        if (!event) {
            throw apiError_1.ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
        }
        // Get the enhanced event with seat map from the service
        const enhancedEvent = await event_service_1.eventService.getEventById(id, includeParams);
        // Format event for API response (compatibility format)
        const eventData = {
            id: event.id,
            title: event.title,
            description: event.description,
            start_date: event.startDate.toISOString(),
            end_date: event.endDate.toISOString(),
            status: event.status,
            location: event.location,
            venue: event.location,
            category: event.categories && event.categories.length > 0
                ? event.categories.map(c => c.name).join(', ')
                : 'General',
            images: event.imageUrl
                ? [{ id: 'img1', url: event.imageUrl, is_featured: true }]
                : [],
            poster_image: event.imageUrl || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
            ticket_types: event.ticketCategories
                ? event.ticketCategories.map(tc => ({
                    id: tc.id,
                    name: tc.name,
                    price: parseFloat(tc.price.toString()),
                    quantity: tc.totalSeats,
                    available: tc.totalSeats - tc.bookedSeats
                }))
                : [],
            created_at: event.createdAt.toISOString(),
            updated_at: event.updatedAt.toISOString(),
            seatMap: enhancedEvent.seatMap,
            organizer: event.organizer
                ? {
                    id: event.organizer.id,
                    name: event.organizer.name,
                    email: event.organizer.email
                }
                : undefined
        };
        // Return successful response
        return apiResponse_1.ApiResponse.success(res, 200, 'Event details fetched successfully', eventData);
    });
    /**
     * List IPL matches (cricket events with teams)
     * @route GET /api/public/events/ipl
     */
    /**
     * List IPL matches (cricket events with teams)
     * @route GET /api/public/events/ipl
     */
    static listIPLMatches = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        logger_1.logger.info("IPL Matches API called");
        // Parse query parameters for filtering
        const filters = EventController.parseEventFilters(req);
        // Ensure we only return published events
        filters.status = client_1.EventStatus.PUBLISHED;
        const result = await event_service_1.eventService.getPublishedEvents(filters);
        // Transform to the expected format
        const matches = result.events.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            start_date: event.startDate.toISOString(),
            end_date: event.endDate.toISOString(),
            status: event.status,
            location: event.location,
            venue: event.location,
            category: 'Cricket, IPL',
            teams: {
                team1: {
                    name: event.title.split(' vs ')[0] || 'Team 1',
                    shortName: (event.title.split(' vs ')[0] || 'Team 1').substring(0, 3).toUpperCase(),
                    logo: '/teams/default.svg'
                },
                team2: {
                    name: event.title.split(' vs ')[1] || 'Team 2',
                    shortName: (event.title.split(' vs ')[1] || 'Team 2').substring(0, 3).toUpperCase(),
                    logo: '/teams/default.svg'
                }
            },
            ticketTypes: event.ticketCategories ? event.ticketCategories.map((tc) => ({
                category: tc.name,
                price: parseFloat(tc.price.toString()),
                available: tc.totalSeats - tc.bookedSeats,
                capacity: tc.totalSeats
            })) : [],
            organizer_id: event.organizerId,
            created_at: event.createdAt.toISOString(),
            updated_at: event.updatedAt.toISOString(),
            time: event.startDate.toTimeString().substring(0, 5),
            duration: '3 hours'
        }));
        return apiResponse_1.ApiResponse.success(res, 200, 'IPL matches fetched successfully', { matches });
    });
    /**
     * List available event categories
     * @route GET /api/categories
     */
    static listCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        // Enable CORS for this endpoint
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        // Get categories from database
        const categories = await prisma_1.default.category.findMany({
            select: {
                id: true,
                name: true
            }
        });
        return apiResponse_1.ApiResponse.success(res, 200, 'Categories fetched successfully', { categories });
    });
    /**
     * Get all seats for an event
     * @route GET /api/events/:id/seats
     */
    static getEventSeats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        try {
            // Get event to ensure it exists
            const event = await event_service_1.eventService.getEventById(id);
            if (!event) {
                return apiResponse_1.ApiResponse.error(res, 404, 'Event not found', 'EVENT_NOT_FOUND');
            }
            // In a real implementation, we'd call a seat service
            // For now, we'll use the seat map from the event service
            const seatMap = event.seatMap;
            if (!seatMap) {
                return apiResponse_1.ApiResponse.error(res, 404, 'Seat map not found for this event', 'SEAT_MAP_NOT_FOUND');
            }
            // Transform seat map to the expected format
            const seatsBySection = {};
            seatMap.sections.forEach(section => {
                seatsBySection[section.name] = [];
                section.rows.forEach(row => {
                    row.seats.forEach(seat => {
                        seatsBySection[section.name].push({
                            id: seat.id,
                            label: seat.name,
                            section: section.name,
                            row: row.name,
                            seatNumber: seat.name,
                            status: seat.status,
                            price: seat.price,
                            eventId: id
                        });
                    });
                });
            });
            return apiResponse_1.ApiResponse.success(res, 200, 'Event seats fetched successfully', {
                event_id: id,
                sections: Object.keys(seatsBySection),
                seats: seatsBySection
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching event seats:', error);
            return apiResponse_1.ApiResponse.error(res, 500, 'Error fetching event seats', 'SEATS_FETCH_ERROR');
        }
    });
    /**
     * Upload an image for an event
     * @route POST /api/events/upload-image
     */
    static uploadEventImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        try {
            // Check if file exists in the request
            if (!req.file) {
                throw new apiError_1.ApiError(400, 'No file uploaded', 'FILE_UPLOAD_ERROR');
            }
            const file = req.file;
            const eventId = req.query.event_id;
            // If event_id is provided, verify the event exists
            if (eventId) {
                const event = await event_service_1.eventService.getEventById(eventId);
                if (!event) {
                    throw apiError_1.ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
                }
            }
            // Create a unique filename
            const fileName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
            // Ensure the directory exists
            const uploadDir = path_1.default.join(process.cwd(), 'public', 'events');
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            // Save the file
            const filePath = path_1.default.join(uploadDir, fileName);
            fs_1.default.writeFileSync(filePath, file.buffer);
            // Generate URL for the saved file
            const fileUrl = `/public/events/${fileName}`;
            // If event_id is provided, update the event with the new image
            if (eventId) {
                await event_service_1.eventService.updateEvent(eventId, {
                    imageUrl: fileUrl
                });
            }
            return apiResponse_1.ApiResponse.success(res, 201, 'Image uploaded successfully', {
                fileName,
                filePath,
                url: fileUrl,
                event_id: eventId || null
            });
        }
        catch (error) {
            logger_1.logger.error('Error uploading event image:', error);
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
            throw apiError_1.ApiError.internal('Failed to upload image', 'IMAGE_UPLOAD_FAILED');
        }
    });
    /**
     * Parse event filters from request query parameters
     */
    static parseEventFilters(req) {
        // Validate and parse query parameters using Zod
        const validatedQuery = event_validator_1.eventFilterSchema.parse(req.query);
        const filters = {};
        // Basic filters
        if (validatedQuery.category)
            filters.category = validatedQuery.category;
        if (validatedQuery.date)
            filters.date = validatedQuery.date;
        if (validatedQuery.startDate)
            filters.startDate = validatedQuery.startDate;
        if (validatedQuery.endDate)
            filters.endDate = validatedQuery.endDate;
        if (validatedQuery.search)
            filters.search = validatedQuery.search;
        if (validatedQuery.status)
            filters.status = validatedQuery.status;
        if (validatedQuery.organizerId)
            filters.organizerId = validatedQuery.organizerId;
        // Pagination options
        if (validatedQuery.page)
            filters.page = validatedQuery.page;
        if (validatedQuery.limit)
            filters.limit = validatedQuery.limit;
        if (validatedQuery.cursor)
            filters.cursor = validatedQuery.cursor;
        // Sorting options
        if (validatedQuery.sortBy)
            filters.sortBy = validatedQuery.sortBy;
        if (validatedQuery.sortOrder)
            filters.sortOrder = validatedQuery.sortOrder;
        // Data loading options
        if (validatedQuery.include) {
            filters.include = validatedQuery.include.split(',');
        }
        if (validatedQuery.fields) {
            filters.fields = validatedQuery.fields.split(',');
        }
        // Additional filters
        if (validatedQuery.ids) {
            filters.ids = validatedQuery.ids.split(',');
        }
        return filters;
    }
}
exports.EventController = EventController;
// Export all the original functions as static methods for backward compatibility
exports.listPublicEvents = EventController.listPublicEvents;
exports.getPublicEventById = EventController.getPublicEventById;
exports.listIPLMatches = EventController.listIPLMatches;
exports.listCategories = EventController.listCategories;
//# sourceMappingURL=event.controller.js.map