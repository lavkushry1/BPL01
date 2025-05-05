/**
 * @service EventApiService
 * @description Service for handling event-related API calls to the Express backend.
 */
import { defaultApiClient } from './apiUtils';
import { API_BASE_URL } from './apiUtils';

export interface Category {
  id: string;
  name: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  price: number;
  availableQuantity: number;
  totalCapacity: number;
}

export interface EventImage {
  id: string;
  url: string;
  alt_text?: string;
  is_featured: boolean;
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  available: number;
}

export interface EventScheduleItem {
  time: string;
  title: string;
  description?: string;
}

export interface EventOrganizer {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  date?: string;
  end_date?: string;
  location: string;
  venue?: string;
  organizer_id: string;
  status: 'draft' | 'published' | 'cancelled' | string;
  created_at: string;
  updated_at: string;
  images?: Array<{
    id: string;
    url: string;
    alt_text?: string;
    is_featured?: boolean;
  }>;
  ticket_types: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    available?: number;
  }>;
  ticketTypes?: any[];
  category?: string;
  poster_image?: string;
  seatMap?: any;
  seat_map_id?: string;
  time?: string;
  schedule?: any[];
  organizer?: any;
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
  source?: string;
}

export interface IPLTeam {
  name: string;
  shortName: string;
  logo: string;
}

export interface IPLMatch extends Omit<Event, 'location' | 'ticket_types'> {
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

export interface CreateEventInput {
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location: string;
  status: 'draft' | 'published';
  images: { url: string; alt_text?: string; is_featured: boolean }[];
  ticket_types: { name: string; description?: string; price: number; quantity: number }[];
}

/**
 * Fetch events from the API with optional filtering
 * @param filters Optional filters to apply to the events list
 * @returns Promise with array of events
 */
export const getEvents = async (filters?: EventFilters): Promise<Event[]> => {
  try {
    // Build query params for API call
    const queryParams: Record<string, string> = {};
    if (filters) {
      if (filters.search) queryParams.search = filters.search;
      if (filters.category) queryParams.category = filters.category;
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;
      if (filters.status) queryParams.status = filters.status;
      if (filters.page) queryParams.page = filters.page.toString();
      if (filters.limit) queryParams.limit = filters.limit.toString();
    }

    // Use defaultApiClient which already has the base URL configured
    const response = await defaultApiClient.get('/events', { params: queryParams });

    if (response.data && response.data.data) {
      return response.data.data.events || [];
    }

    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('Error fetching events from API:', error);
    throw new Error('Failed to fetch events. Please try again later.');
  }
};

/**
 * Fetch a single event by ID
 * @param eventId The ID of the event to fetch
 * @returns Promise with the event data
 */
export const getEvent = async (eventId: string): Promise<Event> => {
  try {
    // Check if it's a valid ID
    if (!eventId || eventId.length < 3) {
      throw new Error('Invalid event ID');
    }

    // Use defaultApiClient which already has the base URL configured
    const response = await defaultApiClient.get(`/events/${eventId}`);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Event not found');
  } catch (error) {
    console.error(`Error fetching event ${eventId} from API:`, error);
    throw new Error('Failed to fetch event details. Please try again later.');
  }
};

/**
 * Get IPL matches specifically (filtered by category)
 * @returns Promise with IPL matches
 */
export const getIPLMatches = async (): Promise<IPLMatch[]> => {
  try {
    // Use the getEvents function with category filter for IPL
    const events = await getEvents({
      category: 'Cricket,IPL',
      status: 'published'
    });

    // Map to IPLMatch interface 
    const iplMatches: IPLMatch[] = events
      .filter(event => {
        // Only include events that have teams data structure or IPL/Cricket in title/category
        return event.teams ||
          (event.category && ['ipl', 'cricket'].includes(event.category.toLowerCase())) ||
          (event.title && event.title.toLowerCase().includes('ipl'));
      })
      .map(event => {
        return {
          id: event.id,
          title: event.title,
          description: event.description || '',
          start_date: event.start_date,
          date: event.date,
          end_date: event.end_date,
          teams: event.teams || {
            team1: {
              name: event.title?.split('vs')[0]?.trim() || 'Team 1',
              shortName: '',
              logo: ''
            },
            team2: {
              name: event.title?.split('vs')[1]?.trim() || 'Team 2',
              shortName: '',
              logo: ''
            }
          },
          venue: event.venue || event.location,
          time: event.time || new Date(event.start_date).toLocaleTimeString(),
          organizer_id: event.organizer_id,
          status: event.status,
          created_at: event.created_at,
          updated_at: event.updated_at,
          images: event.images,
          ticketTypes: (event.ticket_types || []).map(tt => ({
            category: tt.name,
            price: tt.price,
            available: tt.available || tt.quantity,
            capacity: tt.quantity
          })),
          category: event.category || 'Cricket',
          posterImage: event.poster_image,
          seatMap: event.seatMap,
          seat_map_id: event.seat_map_id,
          schedule: event.schedule
        };
      });

    return iplMatches;
  } catch (error) {
    console.error('Error fetching IPL matches:', error);
    throw new Error('Failed to fetch IPL matches. Please try again later.');
  }
};

/**
 * Create a new event
 * @param eventData The event data to create
 * @returns Promise with the created event
 */
export const createEvent = async (eventData: CreateEventInput): Promise<Event> => {
  try {
    const response = await defaultApiClient.post('/events', eventData);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Failed to create event');
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Failed to create event. Please try again later.');
  }
};

/**
 * Update an existing event
 * @param eventId The ID of the event to update
 * @param eventData The updated event data
 * @returns Promise with the updated event
 */
export const updateEvent = async (eventId: string, eventData: Partial<CreateEventInput>): Promise<Event> => {
  try {
    const response = await defaultApiClient.put(`/events/${eventId}`, eventData);

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Failed to update event');
  } catch (error) {
    console.error(`Error updating event ${eventId}:`, error);
    throw new Error('Failed to update event. Please try again later.');
  }
};

/**
 * Delete an event
 * @param eventId The ID of the event to delete
 * @returns Promise with success status
 */
export const deleteEvent = async (eventId: string): Promise<{ success: boolean }> => {
  try {
    const response = await defaultApiClient.delete(`/events/${eventId}`);

    return { success: true };
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    throw new Error('Failed to delete event. Please try again later.');
  }
};

/**
 * Get event categories
 * @returns Promise with array of categories
 */
export async function getEventCategories(): Promise<Category[]> {
  try {
    const response = await defaultApiClient.get('/events/categories');

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('Failed to fetch event categories');
  } catch (error) {
    console.error('Error fetching event categories:', error);
    throw new Error('Failed to fetch event categories. Please try again later.');
  }
}

/**
 * Upload an event image
 * @param file The image file to upload
 * @returns Promise with the uploaded image URL
 */
export const uploadEventImage = async (file: File): Promise<{ url: string }> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await defaultApiClient.post('/events/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data && response.data.data && response.data.data.url) {
      return { url: response.data.data.url };
    }

    throw new Error('Invalid upload response');
  } catch (error) {
    console.error('Error uploading event image:', error);
    throw new Error('Failed to upload image. Please try again later.');
  }
};

// Export default object for easier imports
const eventApi = {
  getEvents,
  getEvent,
  getIPLMatches,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventCategories,
  uploadEventImage
};

export default eventApi;
