import { Stadium } from '../models';
import { defaultApiClient } from './api/apiUtils';

export const stadiumService = {
  /**
   * Get all stadiums
   */
  async getAllStadiums() {
    try {
      const response = await defaultApiClient.get('/stadiums');
      return response.data.stadiums;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get stadium by ID
   */
  async getStadiumById(id: string) {
    try {
      const response = await defaultApiClient.get(`/stadiums/${id}`);
      return response.data.stadium;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new stadium
   */
  async createStadium(stadium: Omit<Stadium, 'id' | 'created_at'>) {
    try {
      const response = await defaultApiClient.post('/stadiums', stadium);
      return response.data.stadium;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a stadium
   */
  async updateStadium(id: string, stadium: Partial<Stadium>) {
    try {
      const response = await defaultApiClient.patch(`/stadiums/${id}`, stadium);
      return response.data.stadium;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get seats by stadium ID
   */
  async getSeatsByStadiumId(stadiumId: string) {
    try {
      const response = await defaultApiClient.get(`/stadiums/${stadiumId}/seats`);
      return response.data.seats;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lock seats (mark as unavailable)
   */
  async lockSeats(seatIds: string[]) {
    try {
      const response = await defaultApiClient.post('/seats/lock', { seatIds });
      return response.data.seats;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Unlock seats (mark as available)
   */
  async unlockSeats(seatIds: string[]) {
    try {
      const response = await defaultApiClient.post('/seats/unlock', { seatIds });
      return response.data.seats;
    } catch (error) {
      throw error;
    }
  }
};
