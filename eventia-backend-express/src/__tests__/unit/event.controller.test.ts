import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { NextFunction, Request, Response } from 'express';
import * as eventController from '../../controllers/event.controller';
import { eventService } from '../../services/event.service';
import { ApiError } from '../../utils/apiError';

describe('Event Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = { params: {}, query: {}, body: {}, user: { id: 'user1' }, loaders: { eventWithIncludeLoader: { load: jest.fn() }, eventLoader: { load: jest.fn() } } };
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  test('getAllEvents should return events', async () => {
    const mockEvents = { events: [], pagination: {} };
    jest.spyOn(eventService, 'getAllEvents').mockResolvedValue(mockEvents);
    await eventController.EventController.getAllEvents(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockEvents }));
  });

  test('getEventById should return event', async () => {
    const mockEvent = { id: '1' };
    (mockRequest.loaders!.eventWithIncludeLoader.load as jest.Mock).mockResolvedValue(mockEvent);
    jest.spyOn(eventService, 'getEventById').mockResolvedValue(mockEvent);
    await eventController.EventController.getEventById(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('getEventById should throw not found', async () => {
    (mockRequest.loaders!.eventWithIncludeLoader.load as jest.Mock).mockResolvedValue(null);
    await expect(eventController.EventController.getEventById(mockRequest as Request, mockResponse as Response, mockNext)).rejects.toThrow(ApiError);
  });

  test('createEvent should create event', async () => {
    const mockEvent = { id: '1' };
    jest.spyOn(eventService, 'createEvent').mockResolvedValue(mockEvent);
    await eventController.EventController.createEvent(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  test('updateEvent should update event', async () => {
    const mockEvent = { id: '1' };
    jest.spyOn(eventService, 'updateEvent').mockResolvedValue(mockEvent);
    await eventController.EventController.updateEvent(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('deleteEvent should delete event', async () => {
    (mockRequest.loaders!.eventLoader.load as jest.Mock).mockResolvedValue({ id: '1' });
    jest.spyOn(eventService, 'deleteEvent').mockResolvedValue();
    await eventController.EventController.deleteEvent(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('getPublishedEvents should return published events', async () => {
    const mockEvents = { events: [], pagination: {} };
    jest.spyOn(eventService, 'getPublishedEvents').mockResolvedValue(mockEvents);
    await eventController.EventController.getPublishedEvents(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('getFeaturedEvents should return featured events', async () => {
    const mockEvents: any[] = [];
    jest.spyOn(eventService, 'getFeaturedEvents').mockResolvedValue(mockEvents);
    // Use the class method directly since it's not exported as a standalone function
    await eventController.EventController.getFeaturedEvents(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  test('listPublicEvents should return public events', async () => {
    const mockEvents = { events: [], pagination: {} };
    jest.spyOn(eventService, 'getAllEvents').mockResolvedValue(mockEvents);
    await eventController.EventController.listPublicEvents(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });
});
