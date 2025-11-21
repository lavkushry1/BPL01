import { EventStatus } from '@prisma/client';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma';
import { eventService } from '../services/event.service';
import { EventCreateInput, EventFilters, EventUpdateInput } from '../types/event.types';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

/**
 * Controller for handling event operations
 * Responsible for parsing requests, delegating to services, and formatting responses
 */
export class EventController {
  /**
   * Get all events with optional filtering
   * @route GET /api/events
   */
  static getAllEvents = asyncHandler(async (req: Request, res: Response) => {
    // Parse query parameters for filtering
    const filters = EventController.parseEventFilters(req);

    // Delegate to service
    const result = await eventService.getAllEvents(filters);

    // Return standardized response
    return ApiResponse.success(
      res,
      200,
      'Events fetched successfully',
      {
        events: result.events,
        pagination: result.pagination
      }
    );
  });

  /**
   * Get event by ID
   * @route GET /api/events/:id
   */
  static getEventById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const includeParams = req.query.include ?
      (req.query.include as string).split(',') :
      ['ticketCategories', 'categories'];

    // Use the dataloader from request for optimized query performance
    const event = await req.loaders.eventWithIncludeLoader.load({
      id,
      include: includeParams
    });

    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    // Get the enhanced event with seat map from the service
    const enhancedEvent = await eventService.getEventById(id, includeParams);

    // Return standardized response
    return ApiResponse.success(res, 200, 'Event fetched successfully', enhancedEvent);
  });

  /**
   * Create a new event (Admin only)
   * @route POST /api/admin/events
   */
  static createEvent = asyncHandler(async (req: Request, res: Response) => {
    // Get the authenticated user's ID
    const userId = (req as any).user?.id;

    if (!userId) {
      throw ApiError.unauthorized('Unauthorized', 'UNAUTHORIZED');
    }

    // Prepare event data from request body
    const eventData: EventCreateInput = {
      ...req.body,
      organizerId: userId,
      // Include any relations we want in the response
      include: ['ticketCategories', 'categories', 'organizer']
    };

    // Delegate to service with transaction handling
    const createdEvent = await eventService.createEvent(eventData);

    // Return standardized response
    return ApiResponse.created(res, createdEvent);
  });

  /**
   * Update an existing event (Admin only)
   * @route PUT /api/admin/events/:id
   */
  static updateEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Get the authenticated user's ID
    const userId = (req as any).user?.id;

    if (!userId) {
      throw ApiError.unauthorized('Unauthorized', 'UNAUTHORIZED');
    }

    // Prepare update data from request body
    const updateData: EventUpdateInput = {
      ...req.body,
      // Include any relations we want in the response
      include: ['ticketCategories', 'categories']
    };

    // Delegate to service
    const updatedEvent = await eventService.updateEvent(id, updateData);

    // Return standardized response
    return ApiResponse.success(res, 200, 'Event updated successfully', updatedEvent);
  });

  /**
   * Delete an event (Admin only)
   * @route DELETE /api/admin/events/:id
   */
  static deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Get the authenticated user's ID
    const userId = (req as any).user?.id;

    if (!userId) {
      throw ApiError.unauthorized('Unauthorized', 'UNAUTHORIZED');
    }

    // Use the dataloader to check if event exists before deletion
    const eventExists = await req.loaders.eventLoader.load(id);

    if (!eventExists) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    // Delegate to service for soft deletion
    await eventService.deleteEvent(id);

    // Return standardized response
    return ApiResponse.success(res, 200, 'Event deleted successfully', null);
  });

  /**
   * Get published events for public view
   * @route GET /api/public/events
   */
  static getPublishedEvents = asyncHandler(async (req: Request, res: Response) => {
    // Parse query parameters for filtering
    const filters = EventController.parseEventFilters(req);

    // Ensure we only return published events
    filters.status = EventStatus.PUBLISHED;

    // Support for cursor-based pagination
    if (req.query.cursor) {
      filters.cursor = req.query.cursor as string;
    }

    // Optionally limit fields for better performance
    if (req.query.fields) {
      filters.fields = (req.query.fields as string).split(',');
    }

    // Delegate to service
    const result = await eventService.getPublishedEvents(filters);

    // Return standardized response
    return ApiResponse.success(
      res,
      200,
      'Published events fetched successfully',
      {
        events: result.events,
        pagination: result.pagination
      }
    );
  });

  /**
   * Get featured events
   * @route GET /api/public/events/featured
   */
  static getFeaturedEvents = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;

    // Delegate to service with optimized field selection
    const events = await eventService.getFeaturedEvents(limit);

    // Return standardized response
    return ApiResponse.success(res, 200, 'Featured events fetched successfully', { events });
  });

  /**
   * List all published events for public view
   * @route GET /api/public/events/list
   */
  static listPublicEvents = asyncHandler(async (req: Request, res: Response) => {
    // Enable CORS for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Use the proper service with filters and optimized field selection
    const filters: EventFilters = {
      status: EventStatus.PUBLISHED,
      search: req.query.search as string,
      category: req.query.category as string,
      page: 1,
      limit: 10,
      // Only include fields needed for the listing
      fields: ['id', 'title', 'description', 'startDate', 'endDate', 'location', 'status', 'imageUrl', 'createdAt', 'updatedAt'],
      // Only include relations needed for the listing
      include: ['ticketCategories', 'categories']
    };

    // Support for cursor-based pagination
    if (req.query.cursor) {
      filters.cursor = req.query.cursor as string;
      delete filters.page; // Can't use both pagination methods
    }

    const result = await eventService.getAllEvents(filters);

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

    return ApiResponse.success(res, 200, 'Public events listed successfully', {
      events: formattedEvents,
      pagination
    });
  });

  /**
   * Get a specific event by ID for public view
   * @route GET /api/public/events/:id
   */
  static getPublicEventById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const includeParams = ['ticketCategories', 'categories', 'organizer'];

    // Use dataloader for optimized queries
    const event = await req.loaders.eventWithIncludeLoader.load({
      id,
      include: includeParams
    });

    if (!event) {
      throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
    }

    // Get the enhanced event with seat map from the service
    const enhancedEvent = await eventService.getEventById(id, includeParams);

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
    return ApiResponse.success(res, 200, 'Event details fetched successfully', eventData);
  });

  /**
   * List IPL matches (cricket events with teams)
   * @route GET /api/public/events/ipl
   */
  /**
   * List IPL matches (cricket events with teams)
   * @route GET /api/public/events/ipl
   */
  static listIPLMatches = asyncHandler(async (_req: Request, res: Response) => {
    logger.info("IPL Matches API called");


    const result = await (filters);

    // Transform to the expected format
    const matches = result.events.map(event => ({
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
      ticketTypes: event.ticketCategories ? event.ticketCategories.map(tc => ({
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

    return ApiResponse.success(res, 200, 'IPL matches fetched successfully', { matches });
  });

  /**
   * List available event categories
   * @route GET /api/categories
   */
  static listCategories = asyncHandler(async (req: Request, res: Response) => {
    // Enable CORS for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Get categories from database
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true
      }
    });

    return ApiResponse.success(res, 200, 'Categories fetched successfully', { categories });
  });

  /**
   * Get all seats for an event
   * @route GET /api/events/:id/seats
   */
  static getEventSeats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // Get event to ensure it exists
      const event = await eventService.getEventById(id);

      if (!event) {
        return ApiResponse.error(
          res,
          404,
          'Event not found',
          'EVENT_NOT_FOUND'
        );
      }

      // In a real implementation, we'd call a seat service
      // For now, we'll use the seat map from the event service
      const seatMap = event.seatMap;

      if (!seatMap) {
        return ApiResponse.error(
          res,
          404,
          'Seat map not found for this event',
          'SEAT_MAP_NOT_FOUND'
        );
      }

      // Transform seat map to the expected format
      const seatsBySection: Record<string, any[]> = {};

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

      return ApiResponse.success(res, 200, 'Event seats fetched successfully', {
        event_id: id,
        sections: Object.keys(seatsBySection),
        seats: seatsBySection
      });
    } catch (error) {
      logger.error('Error fetching event seats:', error);
      return ApiResponse.error(
        res,
        500,
        'Error fetching event seats',
        'SEATS_FETCH_ERROR'
      );
    }
  });

  /**
   * Upload an image for an event
   * @route POST /api/events/upload-image
   */
  static uploadEventImage = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if file exists in the request
      if (!req.file) {
        throw new ApiError(400, 'No file uploaded', 'FILE_UPLOAD_ERROR');
      }

      const file = req.file;
      const eventId = req.query.event_id as string;

      // If event_id is provided, verify the event exists
      if (eventId) {
        const event = await eventService.getEventById(eventId);

        if (!event) {
          throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
        }
      }

      // Create a unique filename
      const fileName = `${uuidv4()}${path.extname(file.originalname)}`;

      // Ensure the directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'events');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save the file
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);

      // Generate URL for the saved file
      const fileUrl = `/public/events/${fileName}`;

      // If event_id is provided, update the event with the new image
      if (eventId) {
        await eventService.updateEvent(eventId, {
          imageUrl: fileUrl
        });
      }

      return ApiResponse.success(
        res,
        201,
        'Image uploaded successfully',
        {
          fileName,
          filePath,
          url: fileUrl,
          event_id: eventId || null
        }
      );
    } catch (error) {
      logger.error('Error uploading event image:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to upload image', 'IMAGE_UPLOAD_FAILED');
    }
  });

  /**
   * Parse event filters from request query parameters
   */
  private static parseEventFilters(req: Request): EventFilters {
    // We could destructure, but explicit is clearer
    const filters: EventFilters = {};

    // Basic filters
    if (req.query.category) filters.category = req.query.category as string;
    if (req.query.date) filters.date = req.query.date as string;
    if (req.query.startDate) filters.startDate = req.query.startDate as string;
    if (req.query.endDate) filters.endDate = req.query.endDate as string;
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.status) filters.status = req.query.status as EventStatus;
    if (req.query.organizerId) filters.organizerId = req.query.organizerId as string;

    // Pagination options
    if (req.query.page) filters.page = parseInt(req.query.page as string);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.cursor) filters.cursor = req.query.cursor as string;

    // Sorting options
    if (req.query.sortBy) filters.sortBy = req.query.sortBy as string;
    if (req.query.sortOrder) filters.sortOrder = req.query.sortOrder as 'asc' | 'desc';

    // Data loading options
    if (req.query.include) {
      filters.include = (req.query.include as string).split(',');
    }

    if (req.query.fields) {
      filters.fields = (req.query.fields as string).split(',');
    }

    // Additional filters
    if (req.query.ids) {
      filters.ids = (req.query.ids as string).split(',');
    }

    return filters;
  }
}

// Export all the original functions as static methods for backward compatibility
export const listPublicEvents = EventController.listPublicEvents;
export const getPublicEventById = EventController.getPublicEventById;
export const listIPLMatches = EventController.listIPLMatches;
export const listCategories = EventController.listCategories;
