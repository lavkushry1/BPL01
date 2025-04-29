import { getEvents, getEventById, createEvent } from '@/services/api/eventApi';

export const eventService = {
  /**
   * Get all events
   */
  async getAllEvents() {
    try {
      const response = await getEvents({ status: 'PUBLISHED' });
      return response.events;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get featured events
   */
  async getFeaturedEvents() {
    try {
      // There's no direct API for featured events, so we get all and filter
      // In a real implementation, you'd add a 'featured' query parameter to the API
      const response = await getEvents({ status: 'PUBLISHED' });
      // Filter featured events client-side (this would ideally be done in the API)
      // We need to cast to any since the Event interface doesn't have isFeatured
      return (response.events as any[]).filter(event => event.isFeatured === true || event.is_featured === true); 
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get event by ID
   */
  async getEventById(id: string) {
    try {
      const event = await getEventById(id);
      return event;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new event
   */
  async createEvent(event: any) {
    try {
      const createdEvent = await createEvent(event);
      return createdEvent;
    } catch (error) {
      throw error;
    }
  }
};
