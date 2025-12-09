import { Stadium } from '../models';
import { defaultApiClient } from './api/apiUtils';

export const stadiumService = {
  /**
   * Get all stadiums
   */
  async getAllStadiums() {
      const response = await defaultApiClient.get('/stadiums');
    return response.data.stadiums;
  },

  /**
   * Get stadium by ID
   */
  async getStadiumById(id: string) {
      const response = await defaultApiClient.get(`/stadiums/${id}`);
    return response.data.stadium;
  },

  /**
   * Create a new stadium
   */
  async createStadium(stadium: Omit<Stadium, 'id' | 'created_at'>) {
      const response = await defaultApiClient.post('/stadiums', stadium);
    return response.data.stadium;
  },

  /**
   * Update a stadium
   */
  async updateStadium(id: string, stadium: Partial<Stadium>) {
      const response = await defaultApiClient.patch(`/stadiums/${id}`, stadium);
    return response.data.stadium;
  },

  /**
   * Get seats by stadium ID
   */
  async getSeatsByStadiumId(stadiumId: string) {
      const response = await defaultApiClient.get(`/stadiums/${stadiumId}/seats`);
    return response.data.seats;
  },

  /**
   * Lock seats (mark as unavailable)
   */
  async lockSeats(seatIds: string[]) {
      const response = await defaultApiClient.post('/seats/lock', { seatIds });
    return response.data.seats;
  },

  /**
   * Unlock seats (mark as available)
   */
  async unlockSeats(seatIds: string[]) {
      const response = await defaultApiClient.post('/seats/unlock', { seatIds });
    return response.data.seats;
  }
};
