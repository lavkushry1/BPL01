/**
 * @file eventService.ts
 * @description Service for managing events API
 * Implements event-specific API calls with proper typing
 */

import { BaseApiService } from './baseApiService';
import { 
  Event, 
  EventFilters, 
  EventInput, 
  IPLMatch, 
  Category,
  EventListResponse 
} from '@/types/events';
import { PaginatedResponse } from '@/types/api';

/**
 * Service for handling event-related API calls
 */
export class EventService extends BaseApiService {
  /**
   * Create a new EventService instance
   */
  constructor() {
    super('/api/v1/events');
  }

  /**
   * Get a list of events with optional filtering
   * @param filters Optional filters to apply
   * @returns Promise with paginated events
   */
  async getEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
    return this.getPaginated<Event>('', {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
      ...filters
    });
  }

  /**
   * Get a single event by ID
   * @param id Event ID
   * @returns Promise with event data
   */
  async getEvent(id: string): Promise<Event> {
    if (!id || id.length < 3) {
      throw new Error('Invalid event ID');
    }
    return this.get<Event>(`/${id}`);
  }

  /**
   * Get IPL matches (filtered events)
   * @returns Promise with IPL matches
   */
  async getIPLMatches(): Promise<IPLMatch[]> {
    // Use the getEvents method with specific category filter
    const response = await this.getPaginated<Event>('', {
      page: 1,
      category: 'Cricket,IPL',
      status: 'published',
      limit: 50
    });

    // Filter and convert to IPLMatch type
    const iplMatches = response.items
      .filter(event => {
        return event.teams ||
          (event.category && ['ipl', 'cricket'].includes(event.category.toLowerCase())) ||
          (event.title && event.title.toLowerCase().includes('ipl'));
      })
      .map(event => this.mapToIPLMatch(event));

    return iplMatches;
  }

  /**
   * Create a new event
   * @param eventData Event data to create
   * @returns Promise with created event
   */
  async createEvent(eventData: EventInput): Promise<Event> {
    return this.post<Event, EventInput>('', eventData);
  }

  /**
   * Update an existing event
   * @param id Event ID
   * @param eventData Updated event data
   * @returns Promise with updated event
   */
  async updateEvent(id: string, eventData: Partial<EventInput>): Promise<Event> {
    return this.put<Event, Partial<EventInput>>(`/${id}`, eventData);
  }

  /**
   * Delete an event
   * @param id Event ID
   * @returns Promise with success status
   */
  async deleteEvent(id: string): Promise<{ success: boolean }> {
    await this.delete(`/${id}`);
    return { success: true };
  }

  /**
   * Get all event categories
   * @returns Promise with categories
   */
  async getEventCategories(): Promise<Category[]> {
    return this.get<Category[]>('/categories');
  }

  /**
   * Helper method to map a regular event to an IPL match
   * @param event Event to convert
   * @returns Converted IPL match
   */
  private mapToIPLMatch(event: Event): IPLMatch {
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
      time: event.time || '',
      duration: '3 hours',
      ticketTypes: (event.ticket_types || event.ticketTypes || []).map(tt => ({
        category: tt.name || tt.category || 'Standard',
        price: tt.price,
        available: tt.available,
        capacity: tt.capacity || tt.quantity
      })),
      category: event.category || 'Cricket',
      featured: event.featured || false,
      posterImage: event.poster_image || 
        (event.images && event.images.length > 0 ? event.images[0].url : undefined),
      status: event.status,
      organizer: event.organizer,
      seatMap: event.seatMap,
      seat_map_id: event.seat_map_id,
      schedule: event.schedule,
      source: event.source
    };
  }
}

// Create and export a singleton instance
export const eventService = new EventService(); 