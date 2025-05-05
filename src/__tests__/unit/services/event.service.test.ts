import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { eventService } from '../../../services/event.service';
import { EventRepository } from '../../../repositories/event.repository';
import { ApiError } from '../../../utils/apiError';
import { EventStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../../repositories/event.repository');

describe('EventService', () => {
  let mockEventRepository: jest.Mocked<EventRepository>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockEventRepository = new EventRepository() as jest.Mocked<EventRepository>;
    // Replace the repository instance in the service
    (eventService as any).eventRepository = mockEventRepository;
  });
  
  describe('getAllEvents', () => {
    it('should return events and pagination when filters are applied', async () => {
      // Setup
      const filters = { 
        page: 1, 
        limit: 10,
        status: EventStatus.PUBLISHED,
        include: ['ticketCategories']
      };
      
      const mockEvents = [
        { id: '1', title: 'Event 1', status: EventStatus.PUBLISHED },
        { id: '2', title: 'Event 2', status: EventStatus.PUBLISHED }
      ];
      
      const mockPagination = {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      mockEventRepository.findAll.mockResolvedValue({
        events: mockEvents,
        pagination: mockPagination
      });
      
      // Act
      const result = await eventService.getAllEvents(filters);
      
      // Assert
      expect(result).toEqual({
        events: mockEvents,
        pagination: mockPagination
      });
      expect(mockEventRepository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should handle cursor-based pagination', async () => {
      // Setup
      const filters = { 
        cursor: 'last-cursor-id',
        limit: 10,
        status: EventStatus.PUBLISHED
      };
      
      const mockEvents = [
        { id: '1', title: 'Event 1', status: EventStatus.PUBLISHED },
        { id: '2', title: 'Event 2', status: EventStatus.PUBLISHED }
      ];
      
      const mockPagination = {
        nextCursor: 'next-cursor-id',
        hasMore: true,
        limit: 10
      };
      
      mockEventRepository.findAll.mockResolvedValue({
        events: mockEvents,
        pagination: mockPagination
      });
      
      // Act
      const result = await eventService.getAllEvents(filters);
      
      // Assert
      expect(result).toEqual({
        events: mockEvents,
        pagination: mockPagination
      });
      expect(mockEventRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });
  
  describe('getEventById', () => {
    it('should return event with included relations', async () => {
      // Setup
      const eventId = '123';
      const includeParams = ['ticketCategories', 'categories'];
      
      const mockEvent = { 
        id: eventId, 
        title: 'Test Event',
        ticketCategories: [{ id: 'tc1', name: 'VIP' }],
        categories: [{ id: 'cat1', name: 'Concert' }]
      };
      
      mockEventRepository.findById.mockResolvedValue(mockEvent);
      
      // Act
      const result = await eventService.getEventById(eventId, includeParams);
      
      // Assert
      expect(result).toEqual(mockEvent);
      expect(mockEventRepository.findById).toHaveBeenCalledWith(
        eventId, 
        expect.objectContaining({ include: includeParams })
      );
    });
    
    it('should throw NotFound error when event does not exist', async () => {
      // Setup
      const eventId = 'nonexistent';
      mockEventRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(eventService.getEventById(eventId)).rejects.toThrow(ApiError);
    });
  });

  describe('createEvent', () => {
    it('should create an event with transaction handling', async () => {
      // Setup
      const eventData = {
        title: 'New Event',
        description: 'Event description',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-02'),
        location: 'Test Location',
        status: EventStatus.DRAFT,
        organizerId: 'user-123',
        include: ['ticketCategories']
      };
      
      const mockCreatedEvent = {
        id: 'event-123',
        ...eventData
      };
      
      mockEventRepository.create.mockResolvedValue(mockCreatedEvent);
      
      // Act
      const result = await eventService.createEvent(eventData);
      
      // Assert
      expect(result).toEqual(mockCreatedEvent);
      expect(mockEventRepository.create).toHaveBeenCalledWith(
        eventData,
        expect.any(Object) // Transaction options
      );
    });
  });

  describe('updateEvent', () => {
    it('should update an event', async () => {
      // Setup
      const eventId = 'event-123';
      const updateData = {
        title: 'Updated Event',
        description: 'Updated description',
        include: ['ticketCategories']
      };
      
      const mockUpdatedEvent = {
        id: eventId,
        title: 'Updated Event',
        description: 'Updated description',
        ticketCategories: []
      };
      
      mockEventRepository.update.mockResolvedValue(mockUpdatedEvent);
      
      // Act
      const result = await eventService.updateEvent(eventId, updateData);
      
      // Assert
      expect(result).toEqual(mockUpdatedEvent);
      expect(mockEventRepository.update).toHaveBeenCalledWith(
        eventId,
        updateData,
        expect.any(Object) // Transaction options
      );
    });
  });

  describe('deleteEvent', () => {
    it('should soft delete an event', async () => {
      // Setup
      const eventId = 'event-123';
      
      mockEventRepository.softDelete.mockResolvedValue({ id: eventId });
      
      // Act
      await eventService.deleteEvent(eventId);
      
      // Assert
      expect(mockEventRepository.softDelete).toHaveBeenCalledWith(
        eventId,
        expect.any(Object) // Transaction options
      );
    });
  });

  describe('getPublishedEvents', () => {
    it('should only return published events', async () => {
      // Setup
      const filters = { 
        limit: 10,
        cursor: 'last-cursor-id'
      };
      
      const mockEvents = [
        { id: '1', title: 'Event 1', status: EventStatus.PUBLISHED },
        { id: '2', title: 'Event 2', status: EventStatus.PUBLISHED }
      ];
      
      const mockPagination = {
        nextCursor: 'next-cursor-id',
        hasMore: true,
        limit: 10
      };
      
      mockEventRepository.findAll.mockResolvedValue({
        events: mockEvents,
        pagination: mockPagination
      });
      
      // Act
      const result = await eventService.getPublishedEvents(filters);
      
      // Assert
      expect(result).toEqual({
        events: mockEvents,
        pagination: mockPagination
      });
      
      // Ensure PUBLISHED status was forced in the filters
      expect(mockEventRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EventStatus.PUBLISHED
        })
      );
    });
  });
}); 