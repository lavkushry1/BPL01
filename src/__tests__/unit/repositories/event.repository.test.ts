import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { EventRepository } from '../../../repositories/event.repository';
import prisma from '../../../db/prisma';
import { EventStatus } from '@prisma/client';

// Mock Prisma
jest.mock('../../../db/prisma', () => ({
  event: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  ticketCategory: {
    createMany: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
}));

describe('EventRepository', () => {
  let eventRepository: EventRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    eventRepository = new EventRepository();
  });
  
  describe('findAll', () => {
    it('should return events with correct pagination using cursor-based pagination', async () => {
      // Setup cursor-based pagination
      const filters = {
        limit: 10,
        cursor: 'last-cursor-id',
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };
      
      const mockEvents = [
        { id: 'event1', title: 'Event 1' },
        { id: 'event2', title: 'Event 2' }
      ];
      
      // Mock Prisma responses
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      
      // Act
      const result = await eventRepository.findAll(filters);
      
      // Assert
      expect(result.events).toEqual(mockEvents);
      expect(result.pagination).toHaveProperty('nextCursor');
      expect(result.pagination).toHaveProperty('hasMore');
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: filters.limit + 1, // One more for next cursor
          cursor: { id: filters.cursor },
          orderBy: { [filters.sortBy]: filters.sortOrder }
        })
      );
    });
    
    it('should apply field selection when fields array is provided', async () => {
      // Setup with field selection
      const filters = {
        limit: 10,
        fields: ['id', 'title', 'startDate']
      };
      
      const mockEvents = [
        { id: 'event1', title: 'Event 1' },
        { id: 'event2', title: 'Event 2' }
      ];
      
      // Mock Prisma responses
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      
      // Act
      await eventRepository.findAll(filters);
      
      // Assert - The select object should have the fields set to true
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            title: true,
            startDate: true
          }
        })
      );
    });
    
    it('should include relations when include array is provided', async () => {
      // Setup with relations to include
      const filters = {
        limit: 10,
        include: ['ticketCategories', 'categories']
      };
      
      const mockEvents = [
        { 
          id: 'event1', 
          title: 'Event 1',
          ticketCategories: [],
          categories: []
        }
      ];
      
      // Mock Prisma responses
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      
      // Act
      await eventRepository.findAll(filters);
      
      // Assert - The include object should have relations set to true
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            ticketCategories: true,
            categories: true
          }
        })
      );
    });
    
    it('should correctly apply offset-based pagination', async () => {
      // Setup with offset pagination
      const filters = {
        page: 2,
        limit: 10
      };
      
      const mockEvents = [
        { id: 'event1', title: 'Event 1' },
        { id: 'event2', title: 'Event 2' }
      ];
      
      const totalCount = 25; // Total events for pagination calculation
      
      // Mock Prisma responses
      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prisma.event.count as jest.Mock).mockResolvedValue(totalCount);
      
      // Act
      const result = await eventRepository.findAll(filters);
      
      // Assert
      expect(result.events).toEqual(mockEvents);
      expect(result.pagination).toEqual({
        total: totalCount,
        page: filters.page,
        limit: filters.limit,
        totalPages: 3 // 25 items / 10 per page = 3 pages (ceiling)
      });
      
      // Should skip the right number of records
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,  // Skip first 10 items (page 1)
          take: 10   // Take next 10 items
        })
      );
    });
    
    it('should apply filters for status and search', async () => {
      // Setup with search and status filters
      const filters = {
        status: EventStatus.PUBLISHED,
        search: 'concert'
      };
      
      // Mock Prisma responses
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.event.count as jest.Mock).mockResolvedValue(0);
      
      // Act
      await eventRepository.findAll(filters);
      
      // Assert - Should build correct where clause
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EventStatus.PUBLISHED,
            OR: [
              { title: expect.objectContaining({ contains: 'concert' }) },
              { description: expect.objectContaining({ contains: 'concert' }) }
            ]
          })
        })
      );
    });
  });
  
  describe('findById', () => {
    it('should return event by ID with included relations', async () => {
      const eventId = 'event-123';
      const options = {
        include: ['ticketCategories', 'categories']
      };
      
      const mockEvent = {
        id: eventId,
        title: 'Test Event',
        ticketCategories: [],
        categories: []
      };
      
      // Mock Prisma response
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      
      // Act
      const result = await eventRepository.findById(eventId, options);
      
      // Assert
      expect(result).toEqual(mockEvent);
      expect(prisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        include: {
          ticketCategories: true,
          categories: true
        }
      });
    });
    
    it('should return null when event not found', async () => {
      const eventId = 'nonexistent';
      
      // Mock Prisma response for not found
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Act
      const result = await eventRepository.findById(eventId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('create', () => {
    it('should create an event with related ticket categories', async () => {
      // Setup
      const eventData = {
        title: 'New Event',
        description: 'Event description',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-02'),
        location: 'Test Location',
        status: EventStatus.DRAFT,
        organizerId: 'user-123',
        ticketCategories: [
          { name: 'VIP', price: 200, totalSeats: 50 },
          { name: 'Regular', price: 100, totalSeats: 100 }
        ]
      };
      
      const mockCreatedEvent = {
        id: 'event-123',
        ...eventData,
        ticketCategories: [
          { id: 'tc-1', name: 'VIP', price: 200, totalSeats: 50, eventId: 'event-123' },
          { id: 'tc-2', name: 'Regular', price: 100, totalSeats: 100, eventId: 'event-123' }
        ]
      };
      
      // Mock Prisma responses
      (prisma.event.create as jest.Mock).mockResolvedValue(mockCreatedEvent);
      
      // Act
      const result = await eventRepository.create(eventData);
      
      // Assert
      expect(result).toEqual(mockCreatedEvent);
      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: eventData.title,
            description: eventData.description,
            startDate: eventData.startDate,
            endDate: eventData.endDate
          })
        })
      );
    });
  });
  
  describe('update', () => {
    it('should update an event', async () => {
      // Setup
      const eventId = 'event-123';
      const updateData = {
        title: 'Updated Event',
        description: 'Updated description'
      };
      
      const mockUpdatedEvent = {
        id: eventId,
        ...updateData
      };
      
      // Mock Prisma response
      (prisma.event.update as jest.Mock).mockResolvedValue(mockUpdatedEvent);
      
      // Act
      const result = await eventRepository.update(eventId, updateData);
      
      // Assert
      expect(result).toEqual(mockUpdatedEvent);
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: updateData,
        include: undefined
      });
    });
  });
  
  describe('softDelete', () => {
    it('should soft delete an event by setting status to CANCELLED', async () => {
      // Setup
      const eventId = 'event-123';
      
      const mockDeletedEvent = {
        id: eventId,
        status: EventStatus.CANCELLED
      };
      
      // Mock Prisma response
      (prisma.event.update as jest.Mock).mockResolvedValue(mockDeletedEvent);
      
      // Act
      const result = await eventRepository.softDelete(eventId);
      
      // Assert
      expect(result).toEqual(mockDeletedEvent);
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: { status: EventStatus.CANCELLED }
      });
    });
  });
}); 