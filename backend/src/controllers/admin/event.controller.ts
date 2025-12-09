import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../../utils/logger';

// Mock validation function (in a real app, use a validation library like Joi/Zod)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateEventInput = (data: any) => {
  // This is a simple validation - in a production app, use a proper validation library
  if (!data.title || !data.start_date) {
    return {
      error: {
        details: [
          { message: 'Title and start date are required' }
        ]
      }
    };
  }

  return { error: null, value: data };
};

// Get all events for admin
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;


    // In a real implementation, this would query the database
    const events = [];

    for (let i = 1; i <= 10; i++) {
      events.push({
        id: uuidv4(),
        title: `Test Event ${i + (page - 1) * limit}`,
        description: `Description for test event ${i + (page - 1) * limit}`,
        start_date: new Date().toISOString(),
        location: 'Test Location',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      data: {
        events,
        pagination: {
          total: 50,
          page,
          limit,
          totalPages: Math.ceil(50 / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: (error as Error).message
    });
  }
};

// Get a single event by ID
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // In a real implementation, this would query the database
    const event = {
      id,
      title: 'Test Event',
      description: 'Description for test event',
      start_date: new Date().toISOString(),
      location: 'Test Location',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [
        {
          id: uuidv4(),
          url: 'https://example.com/image.jpg',
          alt_text: 'Test image',
          is_featured: true
        }
      ],
      ticket_types: [
        {
          id: uuidv4(),
          name: 'Standard',
          price: 100,
          quantity: 100,
          available: 100
        }
      ]
    };

    return res.status(200).json({
      success: true,
      message: 'Event retrieved successfully',
      data: { event }
    });
  } catch (error) {
    logger.error(`Error fetching event ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: (error as Error).message
    });
  }
};

// Create a new event
export const createEvent = async (req: Request, res: Response) => {
  try {
    // Validate input data
    const { error, value } = validateEventInput(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event data',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Create event with nested data
    const {
      images = [],
      ticket_types = [],
      teams,
      ...eventData
    } = value;

    // In development mode, log the event data
    logger.debug('Creating event with data:', JSON.stringify({
      ...eventData,
      images: images.length,
      ticket_types: ticket_types.length,
      teams: teams ? 'present' : 'not present'
    }));

    // Create the event with transaction to ensure all related data is created
    try {
      // Generate an ID for the new event
      const eventId = uuidv4();

      // Log the event creation
      logger.info(`Admin is creating new event with ID: ${eventId}`);

      // In a real implementation, this would insert into the database
      // Mock a database insert by creating a return value
      const newEvent = {
        id: eventId,
        ...eventData,
        organizer_id: req.user?.id || 'system',
        teams: teams ? JSON.stringify(teams) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        images: images.map((image: any) => ({
          id: uuidv4(),
          event_id: eventId,
          url: image.url,
          alt_text: image.alt_text || null,
          is_featured: image.is_featured || false
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ticket_types: ticket_types.map((ticket: any) => ({
          id: uuidv4(),
          event_id: eventId,
          name: ticket.name,
          description: ticket.description || null,
          price: ticket.price,
          quantity: ticket.quantity,
          available: ticket.available || ticket.quantity
        }))
      };

      return res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: { event: newEvent }
      });
    } catch (transactionError) {
      logger.error('Transaction error creating event:', transactionError);
      return res.status(500).json({
        success: false,
        message: 'Database error creating event',
        error: (transactionError as Error).message
      });
    }
  } catch (error) {
    logger.error('Error creating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: (error as Error).message
    });
  }
};

// Update an existing event
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate input data
    const { error, value } = validateEventInput(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event data',
        errors: error.details.map(detail => detail.message)
      });
    }

    // In a real implementation, this would update the database
    // For now, just return success
    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: {
        event: {
          id,
          ...value,
          updated_at: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    logger.error(`Error updating event ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: (error as Error).message
    });
  }
};

// Delete an event
export const deleteEvent = async (req: Request, res: Response) => {
  try {


    // In a real implementation, this would delete from the database
    // For now, just return success
    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting event ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: (error as Error).message
    });
  }
};
