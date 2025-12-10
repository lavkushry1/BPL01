/**
 * Stadium Layout Types
 * Used for BookMyShow-style seat selection UI
 */

export interface StadiumBlock {
  id: string;
  name: string;           // "F Block - JIO PAVILION"
  section: string;        // "F_BLOCK"
  priceCategory: number;  // 1500
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  lockedSeats: number;
  color: string;          // Hex color for UI rendering
  coordinates?: {         // SVG path for rendering
    x: number;
    y: number;
    path?: string;
  };
}

export interface PriceCategory {
  price: number;
  color: string;
  label: string;          // "₹1500"
  blocks: string[];       // Block IDs in this category
}

export interface StadiumLayoutResponse {
  eventId: string;
  eventName: string;
  eventDate: string;
  venueId?: string;
  venueName: string;
  priceCategories: PriceCategory[];
  blocks: StadiumBlock[];
  lockDurationSeconds: number;  // e.g., 240 (4 minutes)
  totalSeats: number;
  availableSeats: number;
}

export interface BlockSeatsResponse {
  blockId: string;
  blockName: string;
  section: string;
  price: number;
  seats: SeatInfo[];
  totalSeats: number;
  availableSeats: number;
}

export interface SeatInfo {
  id: string;
  row: string;
  seatNumber: string;
  label: string;          // "A-12"
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'UNAVAILABLE';
  price: number;
  lockedBy?: string;      // userId if locked
  lockedUntil?: string;   // ISO date string
}

export interface LockSeatsRequest {
  eventId: string;
  seatIds: string[];
  quantity?: number;      // For block-based selection
  blockId?: string;       // For block-based selection
}

export interface LockSeatsResponse {
  success: boolean;
  message: string;
  lockedSeats: string[];
  expiresAt: string;      // ISO date string
  lockDurationSeconds: number;
}

export interface SelectedStand {
  blockId: string;
  blockName: string;
  quantity: number;
  pricePerSeat: number;
  totalPrice: number;
}
