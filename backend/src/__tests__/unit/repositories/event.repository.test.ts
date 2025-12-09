import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { EventStatus } from '@prisma/client';
import { EventRepository } from '../../../repositories/event.repository';
import { EventFactory } from '../../factories/event.factory';

// Mock Prisma Client
const mockPrisma = {
  event: {
    findMany: jest.fn<any>(),
    count: jest.fn<any>(),
    findUnique: jest.fn<any>(),
    create: jest.fn<any>(),
    update: jest.fn<any>(),
  }
};

describe('EventRepository', () => {
  let eventRepository: EventRepository;

  beforeEach(() => {
    eventRepository = new EventRepository(mockPrisma as any); // Cast to any because mockPrisma doesn't fully match PrismaClient
    jest.clearAllMocks();
  });

  describe('findMany', () => {
    it('should return events with default parameters', async () => {
      // Arrange
      const mockEvents = EventFactory.createMany(3, EventFactory.createPublished);
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      mockPrisma.event.count.mockResolvedValue(3);

      // Act
      const result = await eventRepository.findMany({});

      // Assert
      expect(result.events).toEqual(mockEvents);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
    });

    it('should filter events by status', async () => {
      // Arrange
      const mockEvents = EventFactory.createMany(2, EventFactory.createBasic, { status: EventStatus.DRAFT });
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      mockPrisma.event.count.mockResolvedValue(2);

      // Act
      const result = await eventRepository.findMany({ status: EventStatus.DRAFT });

      // Assert
      expect(result.events).toEqual(mockEvents);
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: EventStatus.DRAFT })
      }));
    });
  });

  describe('findById', () => {
    it('should return an event when found', async () => {
      // Arrange
      const mockEvent = EventFactory.createBasic();
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);

      // Act
      const result = await eventRepository.findById(mockEvent.id);

      // Assert
      expect(result).toEqual(mockEvent);
      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockEvent.id }
      }));
    });

    it('should return null when event is not found', async () => {
      // Arrange
      mockPrisma.event.findUnique.mockResolvedValue(null);

      // Act
      const result = await eventRepository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'non-existent-id' }
      }));
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
      mockPrisma.event.create.mockResolvedValue(mockCreatedEvent);

      // Act
      const result = await eventRepository.create(eventData as any);

      // Assert
      expect(result).toEqual(mockCreatedEvent);
      expect(mockPrisma.event.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ title: 'Test Event' })
      }));
    });
  });
});
