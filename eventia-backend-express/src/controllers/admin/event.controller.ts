import { Request, Response } from 'express';
import { prisma } from '@/db';
import { validateEventInput } from '@/validations/event.validation';
import { ApiError } from '@/utils/api-error';

// List all events (with optional filtering)
export const listEvents = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      category, 
      startDate, 
      endDate, 
      status = 'all',
      page = 1, 
      limit = 10 
    } = req.query;

    // Build filtering conditions
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (category) {
      const categories = (category as string).split(',');
      where.category = { in: categories };
    }
    
    if (startDate) {
      where.start_date = { gte: new Date(startDate as string) };
    }
    
    if (endDate) {
      where.end_date = { lte: new Date(endDate as string) };
    }
    
    if (status !== 'all') {
      where.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Fetch events with pagination
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { start_date: 'asc' },
        include: {
          images: true,
          ticket_types: true
        }
      }),
      prisma.event.count({ where })
    ]);

    // Return paginated results
    return res.json({
      success: true,
      data: {
        events,
        pagination: {
          total: totalCount,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalCount / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error listing events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: (error as Error).message
    });
  }
};

// Get event by ID
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        images: true,
        ticket_types: true
      }
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    return res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error(`Error fetching event ${req.params.id}:`, error);
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
    
    // Create the event with transaction to ensure all related data is created
    const event = await prisma.$transaction(async (tx) => {
      // Create the main event
      const newEvent = await tx.event.create({
        data: {
          ...eventData,
          organizer_id: req.user.id, // Get from authenticated user
          teams: teams ? JSON.stringify(teams) : null,
          images: {
            create: images.map((image: any) => ({
              url: image.url,
              alt_text: image.alt_text || null,
              is_featured: image.is_featured || false
            }))
          },
          ticket_types: {
            create: ticket_types.map((ticket: any) => ({
              name: ticket.name,
              description: ticket.description || null,
              price: ticket.price,
              quantity: ticket.quantity,
              available: ticket.available || ticket.quantity
            }))
          }
        },
        include: {
          images: true,
          ticket_types: true
        }
      });
      
      return newEvent;
    });
    
    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });
  } catch (error) {
    console.error('Error creating event:', error);
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
    
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });
    
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Validate input data (partial validation for update)
    const { error, value } = validateEventInput(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event data',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    // Extract related data
    const { 
      images, 
      ticket_types,
      teams,
      ...eventData 
    } = value;
    
    // Update the event with transaction
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Update main event data
      const event = await tx.event.update({
        where: { id },
        data: {
          ...eventData,
          teams: teams ? JSON.stringify(teams) : undefined
        }
      });
      
      // Handle images if provided
      if (images && images.length > 0) {
        // Delete existing images
        await tx.eventImage.deleteMany({
          where: { event_id: id }
        });
        
        // Create new images
        await tx.eventImage.createMany({
          data: images.map((image: any) => ({
            event_id: id,
            url: image.url,
            alt_text: image.alt_text || null,
            is_featured: image.is_featured || false
          }))
        });
      }
      
      // Handle ticket types if provided
      if (ticket_types && ticket_types.length > 0) {
        // Delete existing ticket types
        await tx.ticketType.deleteMany({
          where: { event_id: id }
        });
        
        // Create new ticket types
        await tx.ticketType.createMany({
          data: ticket_types.map((ticket: any) => ({
            event_id: id,
            name: ticket.name,
            description: ticket.description || null,
            price: ticket.price,
            quantity: ticket.quantity,
            available: ticket.available || ticket.quantity
          }))
        });
      }
      
      // Return the updated event with all relations
      return tx.event.findUnique({
        where: { id },
        include: {
          images: true,
          ticket_types: true
        }
      });
    });
    
    return res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event: updatedEvent }
    });
  } catch (error) {
    console.error(`Error updating event ${req.params.id}:`, error);
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
    const { id } = req.params;
    
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id }
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Delete with transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Delete related images
      await tx.eventImage.deleteMany({
        where: { event_id: id }
      });
      
      // Delete related ticket types
      await tx.ticketType.deleteMany({
        where: { event_id: id }
      });
      
      // Finally delete the event itself
      await tx.event.delete({
        where: { id }
      });
    });
    
    return res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting event ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: (error as Error).message
    });
  }
}; 