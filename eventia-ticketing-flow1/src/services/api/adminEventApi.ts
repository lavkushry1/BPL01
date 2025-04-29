import { defaultApiClient } from './apiUtils';
import { Event } from './eventApi';

export interface EventInput {
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location: string;
  status: 'draft' | 'published' | 'cancelled';
  category: string;
  featured?: boolean;
  posterImage?: string;
  venue?: string;
  time?: string;
  duration?: string;
  images: {
    url: string;
    alt_text?: string;
    is_featured?: boolean;
  }[];
  ticket_types: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    available?: number;
  }[];
  teams?: {
    team1: {
      name: string;
      shortName: string;
      logo: string;
    };
    team2: {
      name: string;
      shortName: string;
      logo: string;
    };
  };
}

export interface AdminEventResponse {
  success: boolean;
  message?: string;
  data?: {
    event: Event;
    events?: Event[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  errors?: string[];
}

/**
 * Fetch all events for admin management
 */
export const fetchAdminEvents = async (filters?: any): Promise<AdminEventResponse> => {
  try {
    const response = await defaultApiClient.get('/admin/events', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin events:', error);
    throw error;
  }
};

/**
 * Fetch a single event by ID for admin management
 */
export const fetchAdminEventById = async (id: string): Promise<AdminEventResponse> => {
  try {
    const response = await defaultApiClient.get(`/admin/events/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching admin event ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new event (admin only)
 */
export const createEvent = async (data: EventInput): Promise<AdminEventResponse> => {
  try {
    const response = await defaultApiClient.post('/admin/events', data);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Update an existing event (admin only)
 */
export const updateEvent = async (id: string, data: Partial<EventInput>): Promise<AdminEventResponse> => {
  try {
    const response = await defaultApiClient.put(`/admin/events/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an event (admin only)
 */
export const deleteEvent = async (id: string): Promise<AdminEventResponse> => {
  try {
    const response = await defaultApiClient.delete(`/admin/events/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    throw error;
  }
};

export default {
  fetchAdminEvents,
  fetchAdminEventById,
  createEvent,
  updateEvent,
  deleteEvent
}; 