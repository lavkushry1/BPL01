import { EventStatus } from '@prisma/client';
import db from '../../../db';
import { EventRepository } from '../../../repositories/event.repository';
import { EventFactory } from '../../factories/event.factory';

// Mock the database client
jest.mock('../../../../db');

describe('EventRepository', () => {
  let eventRepository: EventRepository;

  beforeEach(() => {
    eventRepository = new EventRepository();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('findMany', () => {
    it('should return events with default parameters', async () => {
      // Arrange
      const mockEvents = EventFactory.createMany(3, EventFactory.createPublished);
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(mockEvents)
      });

      // Act
      const result = await eventRepository.findMany({});

      // Assert
      expect(result.events).toEqual(mockEvents);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should filter events by status', async () => {
      // Arrange
      const mockEvents = EventFactory.createMany(2, EventFactory.createBasic, { status: EventStatus.DRAFT });
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(mockEvents)
      });

      // Act
      const result = await eventRepository.findMany({ status: EventStatus.DRAFT });

      // Assert
      expect(result.events).toEqual(mockEvents);
    });
  });

  describe('findById', () => {
    it('should return an event when found', async () => {
      // Arrange
      const mockEvent = EventFactory.createBasic();
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockEvent)
      });

      // Act
      const result = await eventRepository.findById(mockEvent.id);

      // Assert
      expect(result).toEqual(mockEvent);
    });

    it('should return null when event is not found', async () => {
      // Arrange
      (db as any).mockResolvedValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null)
      });

      // Act
      const result = await eventRepository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new event', async () => {
      // Arrange
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        startDate: new Date(),
        endDate: new Date(),
        status: EventStatus.DRAFT,
        organizerId: 'organizer-id'
      };

      const mockCreatedEvent = { ...eventData, id: 'event-id', createdAt: new Date(), updatedAt: new Date() };
      (db as any).mockResolvedValue({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockCreatedEvent])
      });

      // Act
      const result = await eventRepository.create(eventData as any);

      // Assert
      expect(result).toEqual(mockCreatedEvent);
    });
  });
});
