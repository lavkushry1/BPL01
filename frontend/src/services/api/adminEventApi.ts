import { defaultApiClient } from './apiUtils';
import { Event } from './eventApi';
import { CreateEventInput } from './eventApi';

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
 * Create a new event as an admin
 */
export const createEvent = async (eventData: CreateEventInput): Promise<Event> => {
  try {
    const response = await defaultApiClient.post('/admin/events', eventData);
    const newEvent = response.data.data?.event;

    // Add to local storage for the public events page to access
    saveEventToLocalStorage(newEvent);

    return newEvent;
  } catch (error) {
    console.error('Error creating event via admin API:', error);
    throw error; // Propagate the error to be handled by the caller
  }
};

/**
 * Update an existing event as an admin
 */
export const updateEvent = async (eventId: string, eventData: Partial<CreateEventInput>): Promise<Event> => {
  try {
    const response = await defaultApiClient.put(`/admin/events/${eventId}`, eventData);
    const updatedEvent = response.data.data?.event;

    // Update in local storage
    updateEventInLocalStorage(updatedEvent);

    return updatedEvent;
  } catch (error) {
    console.error(`Error updating event ${eventId} via admin API:`, error);
    throw error; // Propagate the error to be handled by the caller
  }
};

/**
 * Delete an event as an admin
 */
export const deleteEvent = async (eventId: string): Promise<{ success: boolean }> => {
  try {
    await defaultApiClient.delete(`/admin/events/${eventId}`);

    // Remove from local storage
    removeEventFromLocalStorage(eventId);

    return { success: true };
  } catch (error) {
    console.error(`Error deleting event ${eventId} via admin API:`, error);
    throw error; // Propagate the error to be handled by the caller
  }
};

// Local storage helper functions
const saveEventToLocalStorage = (event: Event) => {
  try {
    const storageKey = 'admin_created_events';
    const existingEvents = localStorage.getItem(storageKey);
    let events: Event[] = [];

    if (existingEvents) {
      events = JSON.parse(existingEvents);
    }

    // Check if event already exists and replace it, or add new
    const eventIndex = events.findIndex(e => e.id === event.id);
    if (eventIndex >= 0) {
      events[eventIndex] = event;
    } else {
      events.push(event);
    }

    localStorage.setItem(storageKey, JSON.stringify(events));
    console.log('Saved event to local storage:', event.title);
  } catch (e) {
    console.error('Error saving event to localStorage:', e);
  }
};

const updateEventInLocalStorage = (event: Event) => {
  // We can reuse the save function since it already handles updates
  saveEventToLocalStorage(event);
};

const removeEventFromLocalStorage = (eventId: string) => {
  try {
    const storageKey = 'admin_created_events';
    const existingEvents = localStorage.getItem(storageKey);

    if (existingEvents) {
      let events: Event[] = JSON.parse(existingEvents);
      events = events.filter(e => e.id !== eventId);
      localStorage.setItem(storageKey, JSON.stringify(events));
      console.log(`Removed event ${eventId} from local storage`);
    }
  } catch (e) {
    console.error('Error removing event from localStorage:', e);
  }
};

export default {
  fetchAdminEvents,
  fetchAdminEventById,
  createEvent,
  updateEvent,
  deleteEvent
}; 