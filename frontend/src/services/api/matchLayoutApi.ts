import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

export type MatchSeatStatus =
  | 'AVAILABLE'
  | 'BOOKED'
  | 'LOCKED'
  | 'PENDING'
  | 'RESERVED'
  | 'SOLD'
  | 'BLOCKED'
  | 'MAINTENANCE';

export interface MatchLayoutSeat {
  id: string | null; // Match seat id (Seat.id) – null means not mapped for this match
  stadiumSeatId: string;
  label: string;
  seatNumber: number;
  status: MatchSeatStatus;
  price: number;
  currency: string;
  lockExpiresAt: string | null;
  lockedByMe: boolean;
}

export interface MatchLayoutRow {
  id: string;
  label: string;
  seats: MatchLayoutSeat[];
}

export interface MatchLayoutStand {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  svgPath: string;
  price: number | null;
  currency: string;
  availability: {
    totalSeats: number;
    availableSeats: number;
    bookedSeats: number;
    lockedSeats: number;
    blockedSeats: number;
    isSoldOut: boolean;
  };
  rows: MatchLayoutRow[];
}

export interface MatchLayoutResponse {
  matchId: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    location: string;
  };
  stadium: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    capacity: number | null;
    svgViewBox: string;
  };
  stands: MatchLayoutStand[];
  lockDurationSeconds: number;
  serverTime: string;
}

export const matchLayoutApi = {
  getMatchLayout: async (matchId: string, lockerId?: string): Promise<MatchLayoutResponse> => {
    const response = await defaultApiClient.get(`/matches/${matchId}/layout`, {
      params: lockerId ? { lockerId } : undefined
    });
    return unwrapApiResponse<MatchLayoutResponse>(response);
  },

  lockSeats: async (
    matchId: string,
    seatIds: string[],
    lockerId?: string,
    lockDurationSeconds?: number
  ) => {
    const response = await defaultApiClient.post(`/matches/${matchId}/seats/lock`, {
      seatIds,
      lockerId,
      lockDurationSeconds
    });
    return unwrapApiResponse<{
      matchId: string;
      seatIds: string[];
      lockExpiresAt: string;
    }>(response);
  },

  unlockSeats: async (matchId: string, seatIds: string[], lockerId?: string) => {
    const response = await defaultApiClient.post(`/matches/${matchId}/seats/unlock`, {
      seatIds,
      lockerId
    });
    return unwrapApiResponse<{
      matchId: string;
      seatIds: string[];
      unlockedCount: number;
    }>(response);
  }
};

export default matchLayoutApi;

