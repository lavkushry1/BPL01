import { EventStatus, Prisma } from '@prisma/client';

/**
 * Event domain model matching Prisma model
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  location: string;
  imageUrl: string | null;
  capacity: number | null;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  ticketCategories?: TicketCategory[];
  categories?: Category[];
  organizer?: any;
  seats?: any[];
  discounts?: any[];
  bookings?: any[];
  eventSummary?: any;
}

/**
 * Ticket Category model
 */
export interface TicketCategory {
  id: string;
  name: string;
  description: string;
  price: number | Prisma.Decimal;
  totalSeats: number;
  bookedSeats: number;
  eventId: string;
}

/**
 * Category model
 */
export interface Category {
  id: string;
  name: string;
}

/**
 * Event filter parameters for queries
 */
export interface EventFilters {
  // Basic filters
  category?: string;
  date?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
  status?: EventStatus;
  organizerId?: string;
  
  // Pagination options
  page?: number;
  limit?: number;
  cursor?: string;  // For cursor-based pagination
  
  // Sorting options
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Data loading options
  include?: string[];  // Relations to include
  fields?: string[];   // Fields to select
  
  // Additional filters
  ids?: string[];      // Multiple event IDs
  includeDeleted?: boolean; // Whether to include deleted events
}

/**
 * Paginated response structure
 * Supports both offset-based and cursor-based pagination
 */
export interface PaginationResult {
  // Offset-based pagination fields
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  
  // Cursor-based pagination fields
  nextCursor?: string | null;
  hasMore?: boolean;
}

/**
 * Result containing events and pagination info
 */
export interface EventResult {
  events: Event[];
  pagination: PaginationResult;
}

/**
 * Event data transfer object for API responses
 */
export interface EventDTO {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  location: string;
  imageUrl: string | null;
  capacity: number | null;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  ticketCategories?: TicketCategoryDTO[];
  categories?: CategoryDTO[];
  seatMap?: SeatMapDTO;
  organizer?: any;
  seats?: any[];
  discounts?: any[];
  bookings?: any[];
  eventSummary?: any;
}

/**
 * Ticket Category data transfer object
 */
export interface TicketCategoryDTO {
  id: string;
  name: string;
  description?: string;
  price: number | string | Prisma.Decimal;
  totalSeats: number;
  bookedSeats: number;
}

/**
 * Category data transfer object
 */
export interface CategoryDTO {
  id: string;
  name: string;
}

/**
 * Event creation input data
 */
export interface EventCreateInput {
  title: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date;
  location: string;
  status?: EventStatus;
  capacity?: number;
  organizerId: string;
  imageUrl?: string;
  ticketCategories?: TicketCategoryInput[];
  categoryIds?: string[];
  include?: string[]; // Relations to include in the response
}

/**
 * Ticket Category input for creation/update
 */
export interface TicketCategoryInput {
  name: string;
  description?: string;
  price: number;
  totalSeats: number;
}

/**
 * Event update input data
 */
export interface EventUpdateInput {
  title?: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  location?: string;
  status?: EventStatus;
  capacity?: number;
  imageUrl?: string;
  ticketCategories?: TicketCategoryInput[];
  categoryIds?: string[];
  include?: string[]; // Relations to include in the response
}

/**
 * Seat Map data structure for event seating
 */
export interface SeatMapDTO {
  id: string;
  sections: SeatSectionDTO[];
}

/**
 * Section within a seat map
 */
export interface SeatSectionDTO {
  id: string;
  name: string;
  rows: SeatRowDTO[];
}

/**
 * Row within a section
 */
export interface SeatRowDTO {
  id: string;
  name: string;
  seats: SeatDTO[];
}

/**
 * Individual seat data
 */
export interface SeatDTO {
  id: string;
  name: string;
  status: 'available' | 'reserved' | 'booked' | 'unavailable';
  price: number;
  category: string;
}

/**
 * Query keys for dataloader caching
 */
export interface EventLoaderKey {
  id: string;
  include?: string[];
} 