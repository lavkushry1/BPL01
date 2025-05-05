"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = exports.listIPLMatches = exports.getPublicEventById = exports.listPublicEvents = exports.EventController = void 0;
const apiError_1 = require("../utils/apiError");
const db_1 = require("../db"); // Keep this for now until we update all methods
const uuid_1 = require("uuid");
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create Prisma client instance
const prisma = new client_1.PrismaClient();
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
            const { category, date, page = 1, limit = 10, sort_by = 'createdAt', sort_order = 'desc' } = req.query;
            // Calculate pagination
            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);
            // Build the query conditions
            const where = {};
            if (category) {
                where.categories = {
                    some: {
                        name: category.toString()
                    }
                };
            }
            if (date) {
                // Assuming date format is YYYY-MM-DD
                const dateObj = new Date(date.toString());
                const nextDay = new Date(dateObj);
                nextDay.setDate(nextDay.getDate() + 1);
                where.startDate = {
                    gte: dateObj,
                    lt: nextDay
                };
            }
            // Execute the query with Prisma
            const events = await prisma.event.findMany({
                where,
                include: {
                    ticketCategories: true,
                    categories: true,
                },
                skip,
                take,
                orderBy: {
                    [sort_by.toString() === 'created_at' ? 'createdAt' : sort_by.toString()]: sort_order === 'asc' ? 'asc' : 'desc'
                }
            });
            // Get total count for pagination
            const total = await prisma.event.count({ where });
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
            // Get event with related data using Prisma
            const event = await prisma.event.findUnique({
                where: { id },
                include: {
                    ticketCategories: true,
                    categories: true,
                }
            });
            if (!event) {
                // Return a 404 response instead of throwing an error
                return apiResponse_1.ApiResponse.error(res, 404, 'Event not found', 'EVENT_NOT_FOUND');
            }
            // Generate a mock seat map for the event
            const mockSeatMap = {
                id: `seat-map-${event.id}`,
                sections: event.ticketCategories.map((category, index) => {
                    const rowCount = 5 + index; // More expensive tickets have fewer rows
                    const seatsPerRow = 10 + (index * 2); // More expensive tickets have fewer seats per row
                    return {
                        id: `section-${index}`,
                        name: category.name,
                        rows: Array.from({ length: rowCount }, (_, rowIndex) => ({
                            id: `row-${category.name.charAt(0)}${rowIndex + 1}`,
                            name: `Row ${String.fromCharCode(65 + rowIndex)}`, // A, B, C, etc.
                            seats: Array.from({ length: seatsPerRow }, (_, seatIndex) => ({
                                id: `${category.name.charAt(0)}${rowIndex + 1}-${seatIndex + 1}`,
                                name: `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`,
                                status: 'available',
                                price: parseFloat(category.price.toString()),
                                category: category.name
                            }))
                        }))
                    };
                })
            };
            // For now, respond with the event data enhanced with seat map
            const enhancedEvent = {
                ...event,
                seatMap: mockSeatMap,
                // Add other fields the frontend expects
                venue: event.location,
                time: new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                poster_image: '/assets/events/default-poster.jpg', // Default poster image
            };
            return apiResponse_1.ApiResponse.success(res, 200, 'Event fetched successfully', enhancedEvent);
        }
        catch (error) {
            logger_1.logger.error(`Error fetching event with ID ${id}:`, error);
            return apiResponse_1.ApiResponse.error(res, 500, 'Failed to fetch event details', 'EVENT_FETCH_FAILED');
        }
    });
    /**
     * Create a new event (Admin only)
     * @route POST /api/admin/events
     */
    static createEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { title, description, startDate, endDate, location, category, ticketCategories, status = "DRAFT" } = req.body;
        // Validate required fields
        if (!title || !startDate || !location) {
            throw new apiError_1.ApiError(400, 'Title, start date, and location are required', 'MISSING_REQUIRED_FIELDS');
        }
        try {
            // Get the authenticated user's ID
            const userId = req.user?.id;
            if (!userId) {
                throw new apiError_1.ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
            }
            // Create event with Prisma
            const event = await prisma.event.create({
                data: {
                    title,
                    description: description || "",
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : new Date(startDate),
                    location,
                    status: status,
                    capacity: 0,
                    organizer: {
                        connect: { id: userId }
                    },
                    // Create ticket categories if provided
                    ticketCategories: ticketCategories && ticketCategories.length > 0 ? {
                        create: ticketCategories.map((category) => ({
                            name: category.name,
                            description: category.description || "",
                            price: category.price,
                            totalSeats: category.quantity || 0,
                            bookedSeats: 0
                        }))
                    } : undefined,
                    // Connect to categories if provided
                    categories: category ? {
                        connectOrCreate: {
                            where: { name: category },
                            create: { name: category }
                        }
                    } : undefined
                },
                include: {
                    ticketCategories: true,
                    categories: true
                }
            });
            return apiResponse_1.ApiResponse.success(res, 201, 'Event created successfully', event);
        }
        catch (error) {
            logger_1.logger.error('Error creating event:', error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                // Handle Prisma specific errors
                throw new apiError_1.ApiError(400, `Database error: ${error.message}`, 'DATABASE_ERROR');
            }
            throw new apiError_1.ApiError(500, 'Failed to create event', 'EVENT_CREATE_FAILED');
        }
    });
    /**
     * Update an existing event (Admin only)
     * @route PUT /api/admin/events/:id
     */
    static updateEvent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { title, description, startDate, endDate, location, status, capacity, ticketCategories } = req.body;
        try {
            // Check if event exists
            const existingEvent = await prisma.event.findUnique({
                where: { id },
                include: {
                    ticketCategories: true,
                    categories: true
                }
            });
            if (!existingEvent) {
                throw new apiError_1.ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
            }
            // Get the authenticated user's ID
            const userId = req.user?.id;
            if (!userId) {
                throw new apiError_1.ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
            }
            // Update event with Prisma
            const updatedEvent = await prisma.event.update({
                where: { id },
                data: {
                    title: title !== undefined ? title : undefined,
                    description: description !== undefined ? description : undefined,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    location: location !== undefined ? location : undefined,
                    status: status,
                    capacity: capacity !== undefined ? capacity : undefined
                },
                include: {
                    ticketCategories: true,
                    categories: true
                }
            });
            // Update ticket categories if provided
            if (ticketCategories && Array.isArray(ticketCategories) && ticketCategories.length > 0) {
                // Delete existing categories and create new ones
                await prisma.ticketCategory.deleteMany({
                    where: { eventId: id }
                });
                // Create new ticket categories
                await Promise.all(ticketCategories.map(async (category) => {
                    await prisma.ticketCategory.create({
                        data: {
                            name: category.name,
                            description: category.description || "",
                            price: category.price,
                            totalSeats: category.quantity || 0,
                            bookedSeats: 0,
                            event: {
                                connect: { id }
                            }
                        }
                    });
                }));
            }
            // Get updated event with all relations
            const finalEvent = await prisma.event.findUnique({
                where: { id },
                include: {
                    ticketCategories: true,
                    categories: true
                }
            });
            if (!finalEvent) {
                throw new apiError_1.ApiError(404, 'Event not found after update', 'EVENT_NOT_FOUND');
            }
            return apiResponse_1.ApiResponse.success(res, 200, 'Event updated successfully', finalEvent);
        }
        catch (error) {
            logger_1.logger.error(`Error updating event with ID ${id}:`, error);
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
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
            const existingEvent = await prisma.event.findUnique({
                where: { id }
            });
            if (!existingEvent) {
                throw new apiError_1.ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
            }
            // Delete event and all related data with cascading deletions
            await prisma.event.delete({
                where: { id }
            });
            return apiResponse_1.ApiResponse.success(res, 200, 'Event deleted successfully', { id });
        }
        catch (error) {
            logger_1.logger.error(`Error deleting event with ID ${id}:`, error);
            if (error instanceof apiError_1.ApiError) {
                throw error;
            }
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
                const eventExists = await (0, db_1.db)('events')
                    .where({ id: eventId })
                    .first();
                if (!eventExists) {
                    throw new apiError_1.ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
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
            // If event_id is provided, associate the image with the event
            if (eventId) {
                await (0, db_1.db)('event_images').insert({
                    id: (0, uuid_1.v4)(),
                    event_id: eventId,
                    url: fileUrl,
                    is_featured: false,
                    created_at: db_1.db.fn.now(),
                    updated_at: db_1.db.fn.now()
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
            throw new apiError_1.ApiError(500, 'Failed to upload image', 'IMAGE_UPLOAD_FAILED');
        }
    });
}
exports.EventController = EventController;
/**
 * List all published events for public view
 */
const listPublicEvents = async (req, res) => {
    try {
        // Enable CORS for this endpoint
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        // Use mock data instead of querying DB (until database is properly set up)
        const mockEvents = [
            {
                id: 'event1',
                title: 'Music Festival 2025',
                description: 'An amazing music festival with top artists',
                start_date: '2025-05-15T18:00:00Z',
                end_date: '2025-05-15T23:00:00Z',
                location: 'Central Park, New York',
                status: 'published',
                images: [
                    {
                        id: 'img1',
                        url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
                        is_featured: true
                    }
                ],
                ticket_types: [
                    {
                        id: 'ticket1',
                        name: 'General Admission',
                        price: 50,
                        quantity: 1000,
                        available: 700
                    },
                    {
                        id: 'ticket2',
                        name: 'VIP',
                        price: 150,
                        quantity: 200,
                        available: 120
                    }
                ],
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-10T00:00:00Z',
                poster_image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
                category: 'Music'
            },
            {
                id: 'event2',
                title: 'Tech Conference 2025',
                description: 'The biggest tech conference of the year',
                start_date: '2025-06-10T09:00:00Z',
                end_date: '2025-06-12T18:00:00Z',
                location: 'Convention Center, San Francisco',
                status: 'published',
                images: [
                    {
                        id: 'img2',
                        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
                        is_featured: true
                    }
                ],
                ticket_types: [
                    {
                        id: 'ticket3',
                        name: 'Full Pass',
                        price: 500,
                        quantity: 2000,
                        available: 1500
                    },
                    {
                        id: 'ticket4',
                        name: 'Workshop Pass',
                        price: 200,
                        quantity: 500,
                        available: 300
                    }
                ],
                created_at: '2025-01-15T00:00:00Z',
                updated_at: '2025-01-20T00:00:00Z',
                poster_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
                category: 'Technology'
            },
            {
                id: 'event3',
                title: 'Mumbai Indians vs Chennai Super Kings',
                description: 'Exciting IPL match between MI and CSK',
                start_date: '2025-05-01T19:30:00Z',
                end_date: '2025-05-01T23:00:00Z',
                location: 'Wankhede Stadium, Mumbai',
                status: 'published',
                images: [
                    {
                        id: 'img3',
                        url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e',
                        is_featured: true
                    }
                ],
                ticket_types: [
                    {
                        id: 'ticket5',
                        name: 'General Stand',
                        price: 1000,
                        quantity: 5000,
                        available: 3000
                    },
                    {
                        id: 'ticket6',
                        name: 'Premium Stand',
                        price: 3000,
                        quantity: 2000,
                        available: 1500
                    }
                ],
                created_at: '2025-02-15T00:00:00Z',
                updated_at: '2025-02-20T00:00:00Z',
                poster_image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e',
                category: 'Sports'
            }
        ];
        // Apply search filtering if needed
        let filteredEvents = [...mockEvents];
        const search = req.query.search;
        if (search) {
            filteredEvents = filteredEvents.filter(event => event.title.toLowerCase().includes(search.toLowerCase()) ||
                event.description.toLowerCase().includes(search.toLowerCase()));
        }
        // Apply category filtering if needed
        const category = req.query.category;
        if (category) {
            const categories = category.split(',');
            filteredEvents = filteredEvents.filter(event => categories.includes(event.category));
        }
        // Return successful response
        return res.status(200).json({
            status: 'success',
            data: {
                events: filteredEvents,
                pagination: {
                    total: filteredEvents.length,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            }
        });
    }
    catch (error) {
        console.error('Error listing public events:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch events',
            error: error.message
        });
    }
};
exports.listPublicEvents = listPublicEvents;
/**
 * Get a specific event by ID for public view
 */
const getPublicEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await prisma.event.findFirst({
            where: {
                id,
                status: 'PUBLISHED' // Changed from 'published' to match the enum values
            },
            include: {
                ticketCategories: true,
                categories: true
            }
        });
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        // Format event for API response
        const eventData = {
            id: event.id,
            title: event.title,
            description: event.description,
            start_date: event.startDate.toISOString(),
            end_date: event.endDate.toISOString(),
            status: event.status,
            location: event.location,
            venue: event.location,
            category: event.categories.map(c => c.name).join(', '),
            organizer_id: event.organizerId,
            created_at: event.createdAt.toISOString(),
            updated_at: event.updatedAt.toISOString(),
            ticketTypes: event.ticketCategories.map(tc => ({
                category: tc.name,
                price: parseFloat(tc.price.toString()),
                available: tc.totalSeats - tc.bookedSeats,
                capacity: tc.totalSeats
            })),
            // Generate teams data if it looks like a vs match
            teams: event.title.includes(' vs ') ? {
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
            } : null
        };
        return res.json({
            success: true,
            data: {
                event: eventData
            }
        });
    }
    catch (error) {
        console.error(`Error fetching public event ${req.params.id}:`, error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch event',
            error: error.message
        });
    }
};
exports.getPublicEventById = getPublicEventById;
/**
 * List IPL matches (cricket events with teams)
 */
const listIPLMatches = async (req, res) => {
    try {
        console.log("IPL Matches API called");
        // Since we're having issues with the database, return mock data for now
        const mockIplMatches = [
            {
                id: 'ipl1',
                title: 'Mumbai Indians vs Chennai Super Kings',
                description: 'Exciting IPL match between MI and CSK',
                start_date: '2025-05-01T19:30:00',
                end_date: '2025-05-01T23:00:00',
                status: 'PUBLISHED',
                location: 'Wankhede Stadium, Mumbai',
                venue: 'Wankhede Stadium, Mumbai',
                category: 'Cricket, IPL',
                teams: {
                    team1: {
                        name: 'Mumbai Indians',
                        shortName: 'MI',
                        logo: '/teams/default.svg'
                    },
                    team2: {
                        name: 'Chennai Super Kings',
                        shortName: 'CSK',
                        logo: '/teams/default.svg'
                    }
                },
                ticketTypes: [
                    {
                        category: 'General Stand',
                        price: 1000,
                        available: 5000,
                        capacity: 5000
                    },
                    {
                        category: 'Premium Stand',
                        price: 3000,
                        available: 2000,
                        capacity: 2000
                    },
                    {
                        category: 'VIP Box',
                        price: 8000,
                        available: 500,
                        capacity: 500
                    }
                ],
                organizer_id: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                time: '19:30',
                duration: '3 hours'
            },
            {
                id: 'ipl2',
                title: 'Royal Challengers Bangalore vs Delhi Capitals',
                description: 'T20 clash between RCB and DC',
                start_date: '2025-05-05T19:30:00',
                end_date: '2025-05-05T23:00:00',
                status: 'PUBLISHED',
                location: 'M. Chinnaswamy Stadium, Bangalore',
                venue: 'M. Chinnaswamy Stadium, Bangalore',
                category: 'Cricket, IPL',
                teams: {
                    team1: {
                        name: 'Royal Challengers Bangalore',
                        shortName: 'RCB',
                        logo: '/teams/default.svg'
                    },
                    team2: {
                        name: 'Delhi Capitals',
                        shortName: 'DC',
                        logo: '/teams/default.svg'
                    }
                },
                ticketTypes: [
                    {
                        category: 'General Stand',
                        price: 1200,
                        available: 6000,
                        capacity: 6000
                    },
                    {
                        category: 'Premium Stand',
                        price: 3500,
                        available: 2500,
                        capacity: 2500
                    },
                    {
                        category: 'VIP Box',
                        price: 7500,
                        available: 400,
                        capacity: 400
                    }
                ],
                organizer_id: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                time: '19:30',
                duration: '3 hours'
            },
            {
                id: 'ipl3',
                title: 'Kolkata Knight Riders vs Punjab Kings',
                description: 'T20 battle between KKR and PBKS',
                start_date: '2025-05-08T19:30:00',
                end_date: '2025-05-08T23:00:00',
                status: 'PUBLISHED',
                location: 'Eden Gardens, Kolkata',
                venue: 'Eden Gardens, Kolkata',
                category: 'Cricket, IPL',
                teams: {
                    team1: {
                        name: 'Kolkata Knight Riders',
                        shortName: 'KKR',
                        logo: '/teams/default.svg'
                    },
                    team2: {
                        name: 'Punjab Kings',
                        shortName: 'PBKS',
                        logo: '/teams/default.svg'
                    }
                },
                ticketTypes: [
                    {
                        category: 'General Stand',
                        price: 900,
                        available: 7000,
                        capacity: 7000
                    },
                    {
                        category: 'Premium Stand',
                        price: 2800,
                        available: 3000,
                        capacity: 3000
                    },
                    {
                        category: 'VIP Box',
                        price: 6500,
                        available: 600,
                        capacity: 600
                    }
                ],
                organizer_id: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                time: '19:30',
                duration: '3 hours'
            },
            {
                id: 'ipl4',
                title: 'Rajasthan Royals vs Sunrisers Hyderabad',
                description: 'T20 showdown between RR and SRH',
                start_date: '2025-05-12T19:30:00',
                end_date: '2025-05-12T23:00:00',
                status: 'PUBLISHED',
                location: 'Sawai Mansingh Stadium, Jaipur',
                venue: 'Sawai Mansingh Stadium, Jaipur',
                category: 'Cricket, IPL',
                teams: {
                    team1: {
                        name: 'Rajasthan Royals',
                        shortName: 'RR',
                        logo: '/teams/default.svg'
                    },
                    team2: {
                        name: 'Sunrisers Hyderabad',
                        shortName: 'SRH',
                        logo: '/teams/default.svg'
                    }
                },
                ticketTypes: [
                    {
                        category: 'General Stand',
                        price: 800,
                        available: 4500,
                        capacity: 4500
                    },
                    {
                        category: 'Premium Stand',
                        price: 2500,
                        available: 2000,
                        capacity: 2000
                    },
                    {
                        category: 'VIP Box',
                        price: 6000,
                        available: 300,
                        capacity: 300
                    }
                ],
                organizer_id: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                time: '19:30',
                duration: '3 hours'
            }
        ];
        console.log(`Returning ${mockIplMatches.length} mock IPL matches`);
        return res.json({
            success: true,
            data: {
                matches: mockIplMatches
            }
        });
    }
    catch (error) {
        console.error('Error listing IPL matches:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch IPL matches',
            error: error.message
        });
    }
};
exports.listIPLMatches = listIPLMatches;
/**
 * List available event categories
 */
const listCategories = async (req, res) => {
    try {
        // Enable CORS for this endpoint
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        // Use mock categories matching our mock events
        const mockCategories = [
            { id: 'cat-1', name: 'Music' },
            { id: 'cat-2', name: 'Technology' },
            { id: 'cat-3', name: 'Sports' },
            { id: 'cat-4', name: 'Business' },
            { id: 'cat-5', name: 'Arts' }
        ];
        return res.json({
            success: true,
            data: {
                categories: mockCategories
            }
        });
    }
    catch (error) {
        console.error('Error listing categories:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};
exports.listCategories = listCategories;
