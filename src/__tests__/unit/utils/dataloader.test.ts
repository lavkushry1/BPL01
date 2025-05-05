import { describe, expect, it, jest } from '@jest/globals';
import { createLoaders } from '../../../utils/dataloader';
import prisma from '../../../db/prisma';

// Mock Prisma
jest.mock('../../../db/prisma', () => ({
  event: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  category: {
    findMany: jest.fn()
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  }
}));

describe('DataLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should batch multiple event queries into a single request', async () => {
    // Setup
    const loaders = createLoaders();
    const eventIds = ['event1', 'event2', 'event3'];
    
    const mockEvents = [
      { id: 'event1', title: 'Event 1' },
      { id: 'event2', title: 'Event 2' },
      { id: 'event3', title: 'Event 3' }
    ];
    
    // Mock Prisma response for batched query
    (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
    
    // Act - load multiple events separately
    const loadPromises = eventIds.map(id => loaders.eventLoader.load(id));
    const events = await Promise.all(loadPromises);
    
    // Assert
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual(mockEvents[0]);
    expect(events[1]).toEqual(mockEvents[1]);
    expect(events[2]).toEqual(mockEvents[2]);
    
    // The important part: findMany should be called only once with all IDs
    expect(prisma.event.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: {
            in: eventIds
          }
        }
      })
    );
  });
  
  it('should handle included relations in event loader', async () => {
    // Setup
    const loaders = createLoaders();
    const eventRequest = {
      id: 'event1',
      include: ['ticketCategories', 'categories']
    };
    
    const mockEvent = {
      id: 'event1',
      title: 'Event 1',
      ticketCategories: [{ id: 'tc1', name: 'VIP' }],
      categories: [{ id: 'cat1', name: 'Concert' }]
    };
    
    // Mock Prisma response
    (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
    
    // Act
    const event = await loaders.eventWithIncludeLoader.load(eventRequest);
    
    // Assert
    expect(event).toEqual(mockEvent);
    expect(prisma.event.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: eventRequest.id },
        include: {
          ticketCategories: true,
          categories: true
        }
      })
    );
  });

  it('should cache results for repeated requests', async () => {
    // Setup
    const loaders = createLoaders();
    const eventId = 'event1';
    
    const mockEvent = { id: eventId, title: 'Event 1' };
    
    // Mock Prisma response
    (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
    
    // Act - load the same event twice
    const event1 = await loaders.eventLoader.load(eventId);
    const event2 = await loaders.eventLoader.load(eventId);
    
    // Assert - second request should use cache, not call DB again
    expect(event1).toEqual(mockEvent);
    expect(event2).toEqual(mockEvent);
    expect(prisma.event.findUnique).toHaveBeenCalledTimes(1);
  });

  it('should handle batch loading of multiple user queries', async () => {
    // Setup
    const loaders = createLoaders();
    const userIds = ['user1', 'user2'];
    
    const mockUsers = [
      { id: 'user1', name: 'User 1' },
      { id: 'user2', name: 'User 2' }
    ];
    
    // Mock Prisma response
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
    
    // Act
    const users = await Promise.all(userIds.map(id => loaders.userLoader.load(id)));
    
    // Assert
    expect(users).toHaveLength(2);
    expect(users[0]).toEqual(mockUsers[0]);
    expect(users[1]).toEqual(mockUsers[1]);
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
  });

  it('should handle null responses when items are not found', async () => {
    // Setup
    const loaders = createLoaders();
    const eventIds = ['event1', 'nonexistent', 'event3'];
    
    const mockEvents = [
      { id: 'event1', title: 'Event 1' },
      null,
      { id: 'event3', title: 'Event 3' }
    ];
    
    // Mock Prisma response - only 2 events found
    (prisma.event.findMany as jest.Mock).mockResolvedValue([
      { id: 'event1', title: 'Event 1' },
      { id: 'event3', title: 'Event 3' }
    ]);
    
    // Act
    const events = await Promise.all(eventIds.map(id => loaders.eventLoader.load(id)));
    
    // Assert - should return null for nonexistent event
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual(mockEvents[0]);
    expect(events[1]).toBeNull();
    expect(events[2]).toEqual(mockEvents[2]);
  });

  it('should create new loaders for each request to avoid cross-request caching', () => {
    // Setup - create two separate loader instances
    const loaders1 = createLoaders();
    const loaders2 = createLoaders();
    
    // Assert - loaders should be different instances
    expect(loaders1.eventLoader).not.toBe(loaders2.eventLoader);
    expect(loaders1.userLoader).not.toBe(loaders2.userLoader);
    expect(loaders1.categoryLoader).not.toBe(loaders2.categoryLoader);
  });
}); 