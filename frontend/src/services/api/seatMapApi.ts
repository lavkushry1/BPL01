/**
 * @service SeatMapApiService
 * @description Service for interacting with seat map related API endpoints.
 * Provides methods for fetching seat maps, available seats, and managing seat selections.
 * 
 * @apiEndpoints
 * - GET /api/venues/:venueId/seatmap - Get venue seat map configuration
 * - GET /api/events/:eventId/seats - Get available seats for an event
 * - GET /api/events/:eventId/seats/:seatId - Get details for a specific seat
 * - POST /api/events/:eventId/seats/reserve - Reserve seats temporarily
 * - DELETE /api/events/:eventId/seats/reserve - Release temporarily reserved seats
 * 
 * @integration
 * - Integrates with eventApi.ts for event availability checking
 * - Works with bookingApi.ts during the booking process
 * 
 * @dataModel Maps to:
 * - Venue model for overall seat map layout
 * - Seat model for individual seat properties
 * - SeatReservation model for temporary holds
 */
import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

// Define interfaces for seat map data
export interface SeatSection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  price: number;
  currency: string;
  rows: SeatRow[];
}

export interface SeatRow {
  id: string;
  name: string; // e.g., "A", "B", "C"
  seats: Seat[];
}

export interface Seat {
  id: string;
  name: string; // e.g., "A1", "B2"
  status: 'available' | 'reserved' | 'booked' | 'blocked' | 'selected';
  section_id: string;
  row_id: string;
  price?: number; // Optional override of section price
  x: number; // x-coordinate for rendering
  y: number; // y-coordinate for rendering
  width: number;
  height: number;
  reserved_until?: string; // ISO date string when reservation expires
  booking_id?: string; // ID of booking if seat is booked
  user_id?: string; // ID of user who booked/reserved the seat
}

export interface SeatMap {
  id: string;
  name: string;
  description?: string;
  event_id: string;
  venue_id: string;
  sections: SeatSection[];
  width: number;
  height: number;
  background_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SeatMapResponse {
  status: string;
  data: SeatMap;
}

export interface SeatReservationRequest {
  seat_ids: string[];
  user_id?: string; // Optional if user is logged in through token
  expiration_time?: number; // Time in minutes to hold reservation
}

export interface SeatReservationResponse {
  status: string;
  data: {
    reservation_id: string;
    seats: Seat[];
    reserved_until: string; // ISO date string
  };
}

export interface SeatAvailabilityResponse {
  status: string;
  data: {
    available: number;
    reserved: number;
    booked: number;
    blocked: number;
    total: number;
    available_sections: {
      [section_id: string]: number;
    };
  };
}

const apiClient = defaultApiClient;

// SeatMap API service
const seatMapApi = {
  /**
   * Get seat map by ID
   * @param id Seat map ID
   */
  getSeatMapById: async (id: string) => {
    return apiClient.get<SeatMapResponse>(`/seat-maps/${id}`);
  },

  /**
   * Get seat map by event ID
   * @param eventId Event ID
   */
  getSeatMapByEventId: (eventId: string) => {
    return apiClient.get<SeatMapResponse>(`/api/events/${eventId}/seat-map`).then(unwrapApiResponse);
  },

  /**
   * Reserve seats for a limited time
   * @param seatMapId Seat map ID
   * @param data Reservation data
   */
  reserveSeats: (seatMapId: string, data: SeatReservationRequest) => {
    return apiClient.post<SeatReservationResponse>(`/api/seat-maps/${seatMapId}/reserve`, data).then(unwrapApiResponse);
  },

  /**
   * Release seat reservation
   * @param reservationId Reservation ID
   */
  releaseReservation: (reservationId: string) => {
    return apiClient.delete(`/api/reservations/${reservationId}`).then(unwrapApiResponse);
  },

  /**
   * Get seat availability for a seat map
   * @param seatMapId Seat map ID
   */
  getSeatAvailability: (seatMapId: string) => {
    return apiClient.get<SeatAvailabilityResponse>(`/api/seat-maps/${seatMapId}/availability`).then(unwrapApiResponse);
  },

  /**
   * Get seats by section ID
   * @param seatMapId Seat map ID
   * @param sectionId Section ID
   */
  getSeatsBySection: (seatMapId: string, sectionId: string) => {
    return apiClient.get<{ status: string; data: Seat[] }>(`/api/seat-maps/${seatMapId}/sections/${sectionId}/seats`).then(unwrapApiResponse);
  },

  /**
   * Update seat status (admin only)
   * @param seatId Seat ID
   * @param status New seat status
   */
  updateSeatStatus: (seatId: string, status: Seat['status']) => {
    return apiClient.patch(`/api/seats/${seatId}`, { status }).then(unwrapApiResponse);
  },

  /**
   * Get user's selected/reserved seats
   * @param userId User ID
   */
  getUserSelectedSeats: (userId: string) => {
    return apiClient.get<{ status: string; data: Seat[] }>(`/api/users/${userId}/selected-seats`).then(unwrapApiResponse);
  },

  /**
   * Get seats by booking ID
   * @param bookingId Booking ID
   */
  getSeatsByBookingId: (bookingId: string) => {
    return apiClient.get<{ status: string; data: Seat[] }>(`/api/bookings/${bookingId}/seats`).then(unwrapApiResponse);
  }
};

export default seatMapApi;
