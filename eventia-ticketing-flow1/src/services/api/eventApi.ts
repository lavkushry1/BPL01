/**
 * @service EventApiService
 * @description Service for handling event-related API calls to the Express backend.
 */
import { defaultApiClient } from './apiUtils';

export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  price: number;
  availableQuantity: number;
  totalCapacity: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  organizerId?: string;
  venueId?: string;
  ticketCategories: TicketCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface IPLTeam {
  name: string;
  shortName: string;
  logo: string;
}

export interface IPLMatch extends Omit<Event, 'location' | 'ticketCategories'> {
  teams: {
    team1: IPLTeam;
    team2: IPLTeam;
  };
  venue: string;
  time: string;
  duration?: string;
  ticketTypes: {
    category: string;
    price: number;
    available: number;
    capacity: number;
  }[];
  category: string;
  featured?: boolean;
  posterImage?: string;
}

export interface EventListResponse {
  events: (Event | IPLMatch)[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EventFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Get a list of events with optional filters
 */
export const getEvents = async (filters?: EventFilters): Promise<EventListResponse> => {
  try {
    // Convert filters to URL query parameters
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await defaultApiClient.get(`/api/v1/events?${params.toString()}`);
    
    // Handle data normalization for different event types if needed
    return {
      events: response.data.data.events || [],
      pagination: response.data.data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Get a single event by ID
 */
export const getEventById = async (eventId: string): Promise<Event | IPLMatch> => {
  try {
    const response = await defaultApiClient.get(`/api/v1/events/${eventId}`);
    // Check if it's an IPL match or regular event and normalize if needed
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Get IPL matches (special endpoint)
 */
export const getIPLMatches = async (): Promise<IPLMatch[]> => {
  try {
    const response = await defaultApiClient.get('/api/v1/events/ipl');
    return response.data.data.matches || [];
  } catch (error) {
    console.error('Error fetching IPL matches:', error);
    throw error;
  }
};

/**
 * Create a new event
 */
export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
  try {
    const response = await defaultApiClient.post('/events', eventData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Update an existing event
 */
export const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<Event> => {
  try {
    const response = await defaultApiClient.patch(`/events/${eventId}`, eventData);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await defaultApiClient.delete(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Get event categories
 */
export const getEventCategories = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const response = await defaultApiClient.get('/api/v1/events/categories');
    return response.data.data.categories || [];
  } catch (error) {
    console.error('Error fetching event categories:', error);
    throw error;
  }
};

export default {
  getEvents,
  getEventById,
  getIPLMatches,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventCategories
};
