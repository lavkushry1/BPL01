import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

export interface LayoutStandSummary {
  id: string;
  code: string;
  name: string;
  svgPath: string;
  minPrice: number | null;
  maxPrice: number | null;
  availableSeats: number;
  totalSeats: number;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'FAST_FILLING';
}

export interface MatchLayoutResponse {
  matchId: string;
  event?: {
    id: string;
    title: string;
    startDate: string;
    location: string;
  };
  stadium: {
    id: string;
    name: string;
    viewBox: string | null;
  };
  stands: LayoutStandSummary[];
  lockDurationSeconds: number;
  serverTime: string;
}

export interface ZoneSeatDetail {
  id: string;
  stadiumSeatId: string;
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
  lockExpiresAt?: string;
}

export const matchLayoutApi = {
  getMatchLayout: async (matchId: string, lockerId?: string): Promise<MatchLayoutResponse> => {
    const response = await defaultApiClient.get(`/matches/${matchId}/layout`, {
      params: lockerId ? { lockerId } : undefined,
    });
    return unwrapApiResponse<MatchLayoutResponse>(response);
  },

  getZoneSeats: async (matchId: string, zoneId: string, lockerId?: string): Promise<ZoneSeatDetail[]> => {
    const response = await defaultApiClient.get(`/matches/${matchId}/zones/${zoneId}/seats`, {
      params: lockerId ? { lockerId } : undefined,
    });
    return unwrapApiResponse<ZoneSeatDetail[]>(response) || [];
  },

  lockSeats: async (
    matchId: string,
    seatIds: string[],
    lockerId?: string,
    lockDurationSeconds?: number
  ): Promise<{ matchId: string; seatIds: string[]; lockExpiresAt: string }> => {
    const response = await defaultApiClient.post(`/matches/${matchId}/seats/lock`, {
      seatIds,
      lockerId,
      lockDurationSeconds
    });
    return unwrapApiResponse(response);
  },

  unlockSeats: async (
    matchId: string,
    seatIds: string[],
    lockerId?: string
  ): Promise<{ matchId: string; seatIds: string[]; unlockedCount: number }> => {
    const response = await defaultApiClient.post(`/matches/${matchId}/seats/unlock`, {
      seatIds,
      lockerId
    });
    return unwrapApiResponse(response);
  }
};

export default matchLayoutApi;
