/**
 * Centralized type definitions for the booking feature
 */

// Extended type for seat status that includes all possible values
export type SeatStatus = 'available' | 'reserved' | 'booked' | 'blocked' | 'selected' | 'locked';

// Basic seat type used across booking components
export interface Seat {
  id: string;
  name: string;
  price: number;
  status: SeatStatus;
  row?: string;
  number?: number;
  category?: string;
}

// Section of seats within a venue
export interface SeatSection {
  id: string;
  name: string;
  rows: SeatRow[];
}

// Row of seats
export interface SeatRow {
  id: string;
  name: string;
  seats: Seat[];
}

// Complete seat map structure
export interface SeatMap {
  id: string;
  name: string;
  sections: SeatSection[];
}

// Payload for seat reservation requests
export interface SeatReservationRequest {
  seat_ids: string[];
  expiration_time: number;
}

// Pan and zoom state for seat map
export interface ViewState {
  zoomLevel: number;
  pan: { x: number; y: number };
} 