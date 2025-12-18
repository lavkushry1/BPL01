import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

export interface LayoutStandSummary {
  id: string;
  name: string;
  code: string;
  svgPath: string;
  minPrice: number | null;
  maxPrice: number | null;
  availableSeats: number;
  totalSeats: number;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'FAST_FILLING';
}

export interface ZoneSeatDetail {
  id: string;
  seatNumber: string;
  rowLabel: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'SELECTED';
  price: number;
  type: string;
  grid: {
    row: number;
    col: number;
    x?: number;
    y?: number;
  };
}

export const matchLayoutApi = {
  /**
   * Step 1: Get Macro Layout (Stands + Pricing)
   */
  getMatchLayout: async (matchId: string): Promise<LayoutStandSummary[]> => {
    // Note: Assuming the route is mounted under /ipl like the others
    const response = await defaultApiClient.get(`/ipl/matches/${matchId}/layout`);
    return unwrapApiResponse<LayoutStandSummary[]>(response) || [];
  },

  /**
   * Step 2: Get Micro Layout (Seats for a specific Stand)
   */
  getZoneSeats: async (matchId: string, zoneId: string): Promise<ZoneSeatDetail[]> => {
    const response = await defaultApiClient.get(`/ipl/matches/${matchId}/zones/${zoneId}/seats`);
    return unwrapApiResponse<ZoneSeatDetail[]>(response) || [];
  }
};

export default matchLayoutApi;