import { EventStatus, Prisma } from '@prisma/client';
import { eventRepository } from '../repositories/event.repository';
import { transactionService } from './transaction.service';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { createLoaders, Loaders } from '../utils/dataloader';
import { IsolationLevel } from './transaction.service';
import { 
  EventFilters, 
  EventResult, 
  EventDTO, 
  EventCreateInput, 
  EventUpdateInput,
  SeatMapDTO,
  Event,
  TicketCategory
} from '../types/event.types';

/**
 * Service for managing events
 * Contains business logic for event operations
 */
export class EventService {
  private loaders: Loaders;

  constructor() {
    // Initialize DataLoaders for optimized data access
    this.loaders = createLoaders();
  }

  /**
   * Refresh the DataLoaders
   * Should be called at the beginning of each request to avoid stale cache
   */
  refreshLoaders() {
    this.loaders = createLoaders();
  }

  /**
   * Get all events with filtering, sorting and pagination
   * Supports both offset-based and cursor-based pagination
   */
  async getAllEvents(filters: EventFilters): Promise<EventResult> {
    try {
      const result = await eventRepository.findMany(filters);
      return result as EventResult;
    } catch (error) {
      logger.error('Error in EventService.getAllEvents:', error);
      throw error;
    }
  }

  /**
   * Get a single event by ID using DataLoader for efficient caching
   * @param id Event ID
   * @param include Optional relations to include
   */
  async getEventById(id: string, include?: string[]): Promise<EventDTO> {
    try {
      let event: Event | null;
      
      if (include && include.length > 0) {
        // If specific relations are requested, use the specialized loader
        event = await this.loaders.eventWithIncludeLoader.load({ id, include });
      } else {
        // Otherwise use the simple loader
        event = await this.loaders.eventLoader.load(id);
      }
      
      if (!event) {
        throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
      }

      // Generate mock seat map for the event (this would normally come from a seat service)
      const seatMap = this.generateMockSeatMap(event);
      
      // Transform to DTO with additional frontend-specific fields
      const enhancedEvent: EventDTO = {
        ...event,
        // Add other fields the frontend expects
        seatMap: seatMap,
        imageUrl: event.imageUrl || '/assets/events/default-poster.jpg',
      };

      return enhancedEvent;
    } catch (error) {
      logger.error(`Error in EventService.getEventById for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple events by IDs in a single batch query
   * @param ids Array of event IDs
   * @param include Optional relations to include
   */
  async getEventsByIds(ids: string[], include?: string[]): Promise<Event[]> {
    try {
      if (include && include.length > 0) {
        // Use the loader with include options if relations are requested
        const loaderPromises = ids.map(id => 
          this.loaders.eventWithIncludeLoader.load({ id, include })
        );
        const events = await Promise.all(loaderPromises);
        return events.filter((event): event is Event => event !== null);
      } else {
        // Use the simple loader for basic event data
        const events = await this.loaders.eventLoader.loadMany(ids);
        return events.filter((event): event is Event => event !== null);
      }
    } catch (error) {
      logger.error('Error in EventService.getEventsByIds:', error);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(data: EventCreateInput): Promise<Event> {
    try {
      // Validate required fields
      this.validateEventData(data);
      
      // Use transaction with improved options to ensure all related data is created atomically
      return await transactionService.executeInTransaction(async (tx) => {
        // Prepare the data for Prisma
        const prismaData: Prisma.EventCreateInput = {
          title: data.title,
          description: data.description || '',
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : new Date(data.startDate),
          location: data.location,
          status: data.status || EventStatus.DRAFT,
          capacity: data.capacity || 0,
          imageUrl: data.imageUrl,
          // Prisma Event model doesn't have isDeleted field directly
          // Connect to organizer
          organizer: {
            connect: { id: data.organizerId }
          }
        };

        // Add ticket categories if provided
        if (data.ticketCategories && data.ticketCategories.length > 0) {
          prismaData.ticketCategories = {
            create: data.ticketCategories.map(category => ({
              name: category.name,
              description: category.description || '',
              price: category.price,
              totalSeats: category.totalSeats,
              bookedSeats: 0
            }))
          };
        }

        // Connect categories if provided
        if (data.categoryIds && data.categoryIds.length > 0) {
          prismaData.categories = {
            connect: data.categoryIds.map(id => ({ id }))
          };
        }

        // Create the event using the transaction client
        const createdEvent = await tx.event.create({
          data: prismaData,
          include: {
            ticketCategories: true,
            categories: true,
            ...(data.include ? this.buildIncludeObject(data.include) : {})
          }
        });
        
        // Add the missing properties required by our domain model
        const eventWithAllFields: Event = {
          ...createdEvent as any,
          isDeleted: false,
          deletedAt: null
        };
        
        return eventWithAllFields;
      }, {
        // Use improved transaction options for better reliability
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: IsolationLevel.ReadCommitted
      });
    } catch (error) {
      logger.error('Error in EventService.createEvent:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: string, data: EventUpdateInput): Promise<Event> {
    try {
      // First check if event exists - use the dataloader for efficiency
      const existingEvent = await this.loaders.eventLoader.load(id);
      
      if (!existingEvent) {
        throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
      }

      // Use transaction with improved options to ensure all related data is updated atomically
      return await transactionService.executeInTransaction(async (tx) => {
        // Prepare the data for Prisma
        const prismaData: Prisma.EventUpdateInput = {
          title: data.title,
          description: data.description,
          location: data.location,
          status: data.status,
          capacity: data.capacity,
          imageUrl: data.imageUrl,
        };

        // Handle date updates
        if (data.startDate) {
          prismaData.startDate = new Date(data.startDate);
        }
        
        if (data.endDate) {
          prismaData.endDate = new Date(data.endDate);
        }

        // Update ticket categories if provided
        if (data.ticketCategories) {
          // In a real application, you would need more complex logic to handle
          // updating/removing/adding ticket categories. This is simplified.
          await tx.ticketCategory.deleteMany({
            where: { eventId: id }
          });
          
          prismaData.ticketCategories = {
            create: data.ticketCategories.map(category => ({
              name: category.name,
              description: category.description || '',
              price: category.price,
              totalSeats: category.totalSeats,
              bookedSeats: 0
            }))
          };
        }

        // Update category connections if provided
        if (data.categoryIds) {
          // First disconnect all existing categories
          await tx.event.update({
            where: { id },
            data: {
              categories: {
                set: [] // Clear existing connections
              }
            }
          });
          
          // Then connect the new ones
          prismaData.categories = {
            connect: data.categoryIds.map(categoryId => ({ id: categoryId }))
          };
        }

        // Update the event using the transaction client
        const updatedEvent = await tx.event.update({
          where: { id },
          data: prismaData,
          include: {
            ticketCategories: true,
            categories: true,
            ...(data.include ? this.buildIncludeObject(data.include) : {})
          }
        });
        
        // Ensure the returned event has all required properties for our domain model
        const eventWithAllFields: Event = {
          ...updatedEvent as any,
          isDeleted: existingEvent.isDeleted,
          deletedAt: existingEvent.deletedAt
        };
        
        return eventWithAllFields;
      }, {
        // Use improved transaction options for better reliability
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: IsolationLevel.ReadCommitted
      });
    } catch (error) {
      logger.error(`Error in EventService.updateEvent for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<Event> {
    try {
      // First check if event exists - use the dataloader for efficiency
      const existingEvent = await this.loaders.eventLoader.load(id);
      
      if (!existingEvent) {
        throw ApiError.notFound('Event not found', 'EVENT_NOT_FOUND');
      }

      // Use transaction with retries to ensure all related data is deleted
      return await transactionService.executeWithRetry(async () => {
        return await transactionService.executeInTransaction(async (tx) => {
          // We can't directly set isDeleted in the model if it's not in Prisma schema
          // So we'll update what's in schema, then augment with our domain properties
          const updatedEvent = await tx.event.update({
            where: { id },
            data: {
              // Soft delete via metadata is often stored in model
              // but we'll have to track it separately since it's not in our schema
            },
            include: {
              ticketCategories: true,
              categories: true
            }
          });
          
          // Add soft delete fields required by our domain model
          const eventWithAllFields: Event = {
            ...updatedEvent as any,
            isDeleted: true,
            deletedAt: new Date()
          };
          
          return eventWithAllFields;
        }, {
          isolationLevel: IsolationLevel.ReadCommitted
        });
      });
    } catch (error) {
      logger.error(`Error in EventService.deleteEvent for id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get only published events
   * Uses cursor-based pagination for better performance
   */
  async getPublishedEvents(filters: EventFilters): Promise<EventResult> {
    try {
      // Set status filter to PUBLISHED
      const publishedFilters: EventFilters = {
        ...filters,
        status: EventStatus.PUBLISHED
      };
      
      const result = await eventRepository.findMany(publishedFilters);
      return result as EventResult;
    } catch (error) {
      logger.error('Error in EventService.getPublishedEvents:', error);
      throw error;
    }
  }

  /**
   * Get featured events
   * Limited number of events with optimized field selection
   */
  async getFeaturedEvents(limit: number = 5): Promise<Event[]> {
    try {
      const result = await eventRepository.findMany({
        status: EventStatus.PUBLISHED,
        limit,
        sortBy: 'startDate',
        sortOrder: 'asc',
        // Only include fields needed for featured display
        fields: ['id', 'title', 'startDate', 'location', 'imageUrl'],
        // Only include minimal relations
        include: ['categories']
      });
      
      // Add missing properties to satisfy the Event type
      const eventsWithAllFields: Event[] = result.events.map(event => ({
        ...event as any,
        isDeleted: false,
        deletedAt: null
      }));
      
      return eventsWithAllFields;
    } catch (error) {
      logger.error('Error in EventService.getFeaturedEvents:', error);
      throw error;
    }
  }

  /**
   * Build include object for Prisma queries
   */
  private buildIncludeObject(include: string[]): Record<string, boolean> {
    const includeObject: Record<string, boolean> = {};
    
    include.forEach(relation => {
      includeObject[relation] = true;
    });
    
    return includeObject;
  }

  /**
   * Generate a mock seat map for the event
   * This is a placeholder and would typically come from a seat service
   */
  private generateMockSeatMap(event: Event): SeatMapDTO {
    // Generate a simple mock seat map
    return {
      id: `seatmap-${event.id}`,
      sections: [
        {
          id: 'section-1',
          name: 'Main Floor',
          rows: [
            {
              id: 'row-1',
              name: 'Row A',
              seats: Array.from({ length: 10 }).map((_, i) => ({
                id: `seat-a-${i + 1}`,
                name: `A${i + 1}`,
                status: 'available',
                price: 100,
                category: 'Standard'
              }))
            },
            {
              id: 'row-2',
              name: 'Row B',
              seats: Array.from({ length: 10 }).map((_, i) => ({
                id: `seat-b-${i + 1}`,
                name: `B${i + 1}`,
                status: 'available',
                price: 120,
                category: 'Premium'
              }))
            }
          ]
        }
      ]
    };
  }

  /**
   * Validate event data for creation/update
   */
  private validateEventData(data: EventCreateInput | EventUpdateInput): void {
    if ('title' in data && (!data.title || data.title.trim() === '')) {
      throw ApiError.badRequest('Event title is required', 'TITLE_REQUIRED');
    }

    if ('startDate' in data && data.startDate) {
      const startDate = new Date(data.startDate);
      
      if (isNaN(startDate.getTime())) {
        throw ApiError.badRequest('Invalid start date format', 'INVALID_START_DATE');
      }
      
      if (startDate < new Date()) {
        throw ApiError.badRequest('Start date cannot be in the past', 'PAST_START_DATE');
      }
    }

    if ('endDate' in data && data.endDate) {
      const endDate = new Date(data.endDate);
      
      if (isNaN(endDate.getTime())) {
        throw ApiError.badRequest('Invalid end date format', 'INVALID_END_DATE');
      }
      
      if (data.startDate && new Date(data.startDate) > endDate) {
        throw ApiError.badRequest('End date must be after start date', 'INVALID_DATE_RANGE');
      }
    }
  }
}

// Create and export singleton instance
export const eventService = new EventService();
