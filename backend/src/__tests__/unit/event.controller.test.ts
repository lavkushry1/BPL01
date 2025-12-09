import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { NextFunction, Request, Response } from 'express';
import * as eventController from '../../controllers/event.controller';
import { eventService } from '../../services/event.service';
import { ApiError } from '../../utils/apiError';

describe('Event Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user1' },
      loaders: {
        eventWithIncludeLoader: { load: jest.fn() },
        eventLoader: { load: jest.fn() }
      }
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    } as any;

    mockNext = jest.fn() as unknown as NextFunction;
    jest.clearAllMocks();
  });

  test('getAllEvents should return events', async () => {
    const mockEvents = { events: [], pagination: {} };
    jest.spyOn(eventService, 'getAllEvents').mockResolvedValue(mockEvents as any);
    await eventController.EventController.getAllEvents(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockEvents }));
  });

  test('getEventById should return event', async () => {
    const mockEvent = { id: '1' };
    ((mockRequest as any).loaders.eventWithIncludeLoader.load as any).mockResolvedValue(mockEvent);
    jest.spyOn(eventService, 'getEventById').mockResolvedValue(mockEvent as any);
    mockRequest.params = { id: '1' };

    await eventController.EventController.getEventById(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('getEventById should throw not found', async () => {
    ((mockRequest as any).loaders.eventWithIncludeLoader.load as any).mockResolvedValue(null);
    mockRequest.params = { id: '1' };

    await eventController.EventController.getEventById(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      message: 'Event not found'
    }));
  });

  test('createEvent should create event', async () => {
    const mockEvent = { id: '1', title: 'Test Event' };
    jest.spyOn(eventService, 'createEvent').mockResolvedValue(mockEvent as any);

    mockRequest.body = {
      title: 'Test Event',
      description: 'Description',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      venue_id: '123e4567-e89b-12d3-a456-426614174000',
      category: 'Music',
      ticket_types: [
        { name: 'General', price: 100, quantity: 50 }
      ]
    };

    await eventController.EventController.createEvent(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  test('updateEvent should update event', async () => {
    const mockEvent = { id: '1', title: 'Updated' };
    jest.spyOn(eventService, 'updateEvent').mockResolvedValue(mockEvent as any);
    mockRequest.params = { id: '1' };
    mockRequest.body = { title: 'Updated' };

    await eventController.EventController.updateEvent(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('deleteEvent should delete event', async () => {
    ((mockRequest as any).loaders.eventLoader.load as any).mockResolvedValue({ id: '1' });
    jest.spyOn(eventService, 'deleteEvent').mockResolvedValue({ id: '1' } as any);
    mockRequest.params = { id: '1' };

    await eventController.EventController.deleteEvent(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('getPublishedEvents should return published events', async () => {
    const mockEvents = { events: [], pagination: {} };
    jest.spyOn(eventService, 'getPublishedEvents').mockResolvedValue(mockEvents as any);
    await eventController.EventController.getPublishedEvents(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('getFeaturedEvents should return featured events', async () => {
    const mockEvents: any[] = [];
    jest.spyOn(eventService, 'getFeaturedEvents').mockResolvedValue(mockEvents);
    await eventController.EventController.getFeaturedEvents(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('listPublicEvents should return public events', async () => {
    const mockEvents = { events: [], pagination: {} };
    jest.spyOn(eventService, 'getAllEvents').mockResolvedValue(mockEvents as any);
    await eventController.EventController.listPublicEvents(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });
});
