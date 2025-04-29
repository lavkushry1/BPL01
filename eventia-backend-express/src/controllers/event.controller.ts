import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

// Define types for ticket types and images
interface TicketType {
  id?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

interface EventImage {
  id?: string;
  url: string;
  alt_text?: string;
  is_featured?: boolean;
}

/**
 * Controller for handling event operations
 */
export class EventController {
  /**
   * Get all events with optional filtering
   * @route GET /api/events
   */
  static getAllEvents = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Parse query parameters for filtering
      const { 
        category, 
        date, 
        page = 1, 
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc' 
      } = req.query;
      
      // Calculate offset for pagination
      const offset = (Number(page) - 1) * Number(limit);
      
      // Build the query
      let query = db('events')
        .select(
          'events.*',
          db.raw('COALESCE(JSON_AGG(DISTINCT event_images.*) FILTER (WHERE event_images.id IS NOT NULL), \'[]\') as images'),
          db.raw('COALESCE(JSON_AGG(DISTINCT ticket_types.*) FILTER (WHERE ticket_types.id IS NOT NULL), \'[]\') as ticket_types')
        )
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
      const countResult = await db('events')
        .count('id as count')
        .first();
      
      const total = Number(countResult?.count || 0);
      
      return ApiResponse.success(res, 200, 'Events fetched successfully', {
        events,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          total_pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw new ApiError(500, 'Failed to fetch events', 'EVENTS_FETCH_FAILED');
    }
  });

  /**
   * Get event by ID
   * @route GET /api/events/:id
   */
  static getEventById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Get event with related data
      const event = await db('events')
        .select(
          'events.*',
          db.raw('COALESCE(JSON_AGG(DISTINCT event_images.*) FILTER (WHERE event_images.id IS NOT NULL), \'[]\') as images'),
          db.raw('COALESCE(JSON_AGG(DISTINCT ticket_types.*) FILTER (WHERE ticket_types.id IS NOT NULL), \'[]\') as ticket_types'),
          db.raw('to_json(venues.*) as venue')
        )
        .leftJoin('event_images', 'events.id', 'event_images.event_id')
        .leftJoin('ticket_types', 'events.id', 'ticket_types.event_id')
        .leftJoin('venues', 'events.venue_id', 'venues.id')
        .where('events.id', id)
        .groupBy('events.id', 'venues.id')
        .first();
      
      if (!event) {
        throw new ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
      }
      
      return ApiResponse.success(res, 200, 'Event fetched successfully', event);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Error fetching event with ID ${id}:`, error);
      throw new ApiError(500, 'Failed to fetch event details', 'EVENT_FETCH_FAILED');
    }
  });

  /**
   * Create a new event (Admin only)
   * @route POST /api/admin/events
   */
  static createEvent = asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      start_date,
      end_date,
      venue_id,
      category,
      has_seat_map,
      seat_map_id,
      ticket_types,
      images
    } = req.body;
    
    // Validate required fields
    if (!title || !start_date || !venue_id) {
      throw new ApiError(400, 'Title, start date, and venue are required', 'MISSING_REQUIRED_FIELDS');
    }
    
    try {
      // Use transaction to ensure data consistency
      const result = await db.transaction(async trx => {
        // Create event
        const eventId = uuidv4();
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
          const ticketTypesWithIds = ticket_types.map((type: TicketType) => ({
            id: uuidv4(),
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
          const imagesWithIds = images.map((image: EventImage, index: number) => ({
            id: uuidv4(),
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
          .select(
            'events.*',
            db.raw('COALESCE(JSON_AGG(DISTINCT event_images.*) FILTER (WHERE event_images.id IS NOT NULL), \'[]\') as images'),
            db.raw('COALESCE(JSON_AGG(DISTINCT ticket_types.*) FILTER (WHERE ticket_types.id IS NOT NULL), \'[]\') as ticket_types')
          )
          .leftJoin('event_images', 'events.id', 'event_images.event_id')
          .leftJoin('ticket_types', 'events.id', 'ticket_types.event_id')
          .where('events.id', eventId)
          .groupBy('events.id')
          .first();
        
        return createdEvent;
      });
      
      return ApiResponse.success(res, 201, 'Event created successfully', result);
    } catch (error) {
      logger.error('Error creating event:', error);
      throw new ApiError(500, 'Failed to create event', 'EVENT_CREATION_FAILED');
    }
  });

  /**
   * Update an event (Admin only)
   * @route PUT /api/admin/events/:id
   */
  static updateEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const eventData = req.body;
    
    try {
      // Check if event exists
      const existingEvent = await db('events')
        .where({ id })
        .first();
      
      if (!existingEvent) {
        throw new ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
      }
      
      // Update the event
      await db.transaction(async trx => {
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
            const ticketTypesWithIds = eventData.ticket_types.map((type: TicketType) => ({
              id: type.id || uuidv4(),
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
            const imagesWithIds = eventData.images.map((image: EventImage, index: number) => ({
              id: image.id || uuidv4(),
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
      const updatedEvent = await db('events')
        .select(
          'events.*',
          db.raw('COALESCE(JSON_AGG(DISTINCT event_images.*) FILTER (WHERE event_images.id IS NOT NULL), \'[]\') as images'),
          db.raw('COALESCE(JSON_AGG(DISTINCT ticket_types.*) FILTER (WHERE ticket_types.id IS NOT NULL), \'[]\') as ticket_types')
        )
        .leftJoin('event_images', 'events.id', 'event_images.event_id')
        .leftJoin('ticket_types', 'events.id', 'ticket_types.event_id')
        .where('events.id', id)
        .groupBy('events.id')
        .first();
      
      return ApiResponse.success(res, 200, 'Event updated successfully', updatedEvent);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Error updating event with ID ${id}:`, error);
      throw new ApiError(500, 'Failed to update event', 'EVENT_UPDATE_FAILED');
    }
  });

  /**
   * Delete an event (Admin only)
   * @route DELETE /api/admin/events/:id
   */
  static deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Check if event exists
      const existingEvent = await db('events')
        .where({ id })
        .first();
      
      if (!existingEvent) {
        throw new ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
      }
      
      // Delete the event and related data
      await db.transaction(async trx => {
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
      
      return ApiResponse.success(res, 200, 'Event deleted successfully');
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Error deleting event with ID ${id}:`, error);
      throw new ApiError(500, 'Failed to delete event', 'EVENT_DELETE_FAILED');
    }
  });

  /**
   * Get all seats for an event
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} - Returns event seats
   */
  static getEventSeats = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      
      // Verify event exists
      const event = await db('events').where('id', id).first();
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      // Get all seats for this event
      const seats = await db('seats')
        .where('eventId', id)
        .select(
          'id',
          'label',
          'section',
          'row',
          'seatNumber',
          'status',
          'price',
          'eventId',
          db.raw('CASE WHEN lock_expires_at > NOW() THEN locked_by ELSE NULL END as locked_by'),
          db.raw('CASE WHEN lock_expires_at > NOW() THEN lock_expires_at ELSE NULL END as lock_expires_at')
        );
      
      // Group seats by section for easier frontend consumption
      const seatsBySection = seats.reduce((acc: any, seat: any) => {
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
    } catch (error) {
      console.error('Error fetching event seats:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching event seats'
      });
    }
  };
} 