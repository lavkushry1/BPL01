/**
 * @service EventApiService
 * @description Service for handling event-related API calls to the Express backend.
 */
import { defaultApiClient } from './apiUtils';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

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
  description: string;
  start_date: string;
  end_date?: string;
  location: string;
  organizer_id: string;
  status: 'draft' | 'published' | 'cancelled';
  images: EventImage[];
  ticket_types: TicketType[];
  created_at: string;
  updated_at: string;
  poster_image?: string;
  schedule?: EventScheduleItem[];
  organizer?: EventOrganizer;
  category?: string;
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
 * Get a list of events with optional filters
 */
export const getEvents = async (filters?: EventFilters): Promise<Event[]> => {
  try {
    const response = await defaultApiClient.get('/admin/events', { params: filters });
    return response.data.events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

/**
 * Get a single event by ID
 */
export const getEvent = async (eventId: string): Promise<Event> => {
  try {
    const response = await defaultApiClient.get(`/admin/events/${eventId}`);
    return response.data.event;
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
    const iplResponse = await defaultApiClient.get('/admin/events/ipl');
    return iplResponse.data.matches || [];
  } catch (error) {
    console.error('Error fetching IPL matches:', error);
    throw error;
  }
};

/**
 * Create a new event
 */
export const createEvent = async (eventData: CreateEventInput): Promise<Event> => {
  try {
    // Uncomment for production use
    // const response = await axios.post(`${API_BASE_URL}/admin/events`, eventData);
    // return response.data;
    
    // For development/testing, just log the action and return mock data
    console.log('Creating event:', eventData);
    
    return {
      id: `new-${Date.now()}`,
      ...eventData,
      organizer_id: 'admin-id',
      status: eventData.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Update an existing event
 */
export const updateEvent = async (eventId: string, eventData: Partial<CreateEventInput>): Promise<Event> => {
  try {
    // Uncomment for production use
    // const response = await axios.put(`${API_BASE_URL}/admin/events/${eventId}`, eventData);
    // return response.data;
    
    // For development/testing, just log the action
    console.log(`Updating event ${eventId}:`, eventData);
    
    // Return mock updated data
    return {
      id: eventId,
      title: eventData.title || 'Updated Event',
      description: eventData.description || 'Updated description',
      start_date: eventData.start_date || new Date().toISOString(),
      end_date: eventData.end_date,
      location: eventData.location || 'Updated location',
      organizer_id: 'admin-id',
      status: eventData.status || 'published',
      images: eventData.images || [],
      ticket_types: eventData.ticket_types || [],
      created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      updated_at: new Date().toISOString()
    } as Event;
  } catch (error) {
    console.error(`Error updating event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<{ success: boolean }> => {
  try {
    // Uncomment for production use
    // await axios.delete(`${API_BASE_URL}/admin/events/${eventId}`);
    
    // For development/testing, just log the action
    console.log(`Deleting event ${eventId}`);
    
    return { success: true };
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
    const response = await defaultApiClient.get('/admin/events/categories');
    return response.data.categories || [];
  } catch (error) {
    console.error('Error fetching event categories:', error);
    throw error;
  }
};

export const uploadEventImage = async (file: File): Promise<{ url: string }> => {
  try {
    // In production, this would upload to a real storage service
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await axios.post(`${API_BASE_URL}/admin/events/upload-image`, formData);
    // return response.data;
    
    // For development/testing, create a mock URL
    console.log(`Uploading image: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Generate random mock URL based on the file name
    const mockImageId = Math.floor(Math.random() * 1000);
    return { 
      url: `https://example.com/uploads/events/${mockImageId}_${file.name}` 
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default {
  getEvents,
  getEvent,
  getIPLMatches,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventCategories,
  uploadEventImage
};
