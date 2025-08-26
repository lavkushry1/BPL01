import { Request, Response } from 'express';
import { EventController } from '../../../controllers/event.controller';
import { eventService } from '../../../services/event.service';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';

// Mock dependencies
jest.mock('../../../services/event.service');
jest.mock('../../../utils/apiResponse');
jest.mock('../../../utils/apiError');

describe('EventController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      body: {},
      loaders: {
        eventWithIncludeLoader: {
          load: jest.fn()
        }
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
    
    // Mock ApiResponse.success and ApiResponse.created
    (ApiResponse.success as jest.Mock) = jest.fn().mockReturnValue({
      status: 200,
      json: { success: true }
    });
    
    (ApiResponse.created as jest.Mock) = jest.fn().mockReturnValue({
      status: 201,
      json: { success: true }
    });
  });
  
  describe('getAllEvents', () => {
    it('should fetch all events successfully', async () => {
      // Mock data
      const mockEvents = [
        { id: '1', name: 'Event 1' },
        { id: '2', name: 'Event 2' }
      ];
      
      const mockPagination = {
        total: 2,
        page: 1,
        limit: 10
      };
      
      // Mock service response
      (eventService.getAllEvents as jest.Mock).mockResolvedValue({
        events: mockEvents,
        pagination: mockPagination
      });
      
      // Call the controller
      await EventController.getAllEvents(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(eventService.getAllEvents).toHaveBeenCalled();
      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Events fetched successfully',
        {
          events: mockEvents,
          pagination: mockPagination
        }
      );
    });
    
    it('should apply filters when provided in query params', async () => {
      // Mock request with filters
      mockRequest.query = {
        search: 'concert',
        category: 'music',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        page: '1',
        limit: '20'
      };
      
      // Mock service response
      (eventService.getAllEvents as jest.Mock).mockResolvedValue({
        events: [],
        pagination: { total: 0, page: 1, limit: 20 }
      });
      
      // Call the controller
      await EventController.getAllEvents(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(eventService.getAllEvents).toHaveBeenCalledWith(expect.objectContaining({
        search: 'concert',
        category: 'music',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        page: 1,
        limit: 20
      }));
    });
  });
  
  describe('getEventById', () => {
    it('should fetch an event by ID successfully', async () => {
      // Mock data
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        name: 'Test Event',
        description: 'Test Description'
      };
      
      // Setup request
      mockRequest.params = { id: eventId };
      mockRequest.query = { include: 'ticketCategories,categories' };
      
      // Mock loader response
      mockRequest.loaders.eventWithIncludeLoader.load.mockResolvedValue(mockEvent);
      
      // Mock service response
      (eventService.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      
      // Call the controller
      await EventController.getEventById(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockRequest.loaders.eventWithIncludeLoader.load).toHaveBeenCalledWith({
        id: eventId,
        include: ['ticketCategories', 'categories']
      });
      
      expect(eventService.getEventById).toHaveBeenCalledWith(
        eventId,
        ['ticketCategories', 'categories']
      );
      
      expect(ApiResponse.success).toHaveBeenCalledWith(
        mockResponse,
        200,
        'Event fetched successfully',
        mockEvent
      );
    });
    
    it('should throw an error when event is not found', async () => {
      // Mock data
      const eventId = 'non-existent-event';
      
      // Setup request
      mockRequest.params = { id: eventId };
      
      // Mock loader response (event not found)
      mockRequest.loaders.eventWithIncludeLoader.load.mockResolvedValue(null);
      
      // Mock ApiError.notFound
      const mockError = new Error('Event not found');
      (ApiError.notFound as jest.Mock).mockReturnValue(mockError);
      
      // Call the controller and expect it to throw
      await expect(EventController.getEventById(
        mockRequest as Request,
        mockResponse as Response
      )).rejects.toThrow(mockError);
      
      // Assertions
      expect(mockRequest.loaders.eventWithIncludeLoader.load).toHaveBeenCalled();
      expect(ApiError.notFound).toHaveBeenCalledWith('Event not found', 'EVENT_NOT_FOUND');
      expect(eventService.getEventById).not.toHaveBeenCalled();
    });
    
    it('should use default includes when none specified', async () => {
      // Mock data
      const eventId = 'event-123';
      const mockEvent = { id: eventId, name: 'Test Event' };
      
      // Setup request without include query
      mockRequest.params = { id: eventId };
      mockRequest.query = {};
      
      // Mock loader response
      mockRequest.loaders.eventWithIncludeLoader.load.mockResolvedValue(mockEvent);
      
      // Mock service response
      (eventService.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      
      // Call the controller
      await EventController.getEventById(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockRequest.loaders.eventWithIncludeLoader.load).toHaveBeenCalledWith({
        id: eventId,
        include: ['ticketCategories', 'categories']
      });
    });
  });
});