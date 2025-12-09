/**
 * @file events.ts
 * @description Type definitions for events
 * Provides centralized types for event data and related entities
 */

/**
 * Event category
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  slug?: string;
}

/**
 * Ticket type for an event
 */
export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  available: number;
  capacity?: number;
  maxPerOrder?: number;
  category?: string;
}

/**
 * Image associated with an event
 */
export interface EventImage {
  id: string;
  url: string;
  alt_text?: string;
  is_featured: boolean;
}

/**
 * Schedule item for an event
 */
export interface EventScheduleItem {
  time: string;
  title: string;
  description?: string;
}

/**
 * Organizer information
 */
export interface EventOrganizer {
  id?: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
}

/**
 * Team information (for sports events)
 */
export interface Team {
  name: string;
  shortName: string;
  logo: string;
  description?: string;
  players?: string[];
}

/**
 * Main Event entity
 */
export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  date?: string;
  end_date?: string;
  location: string;
  venue?: string;
  organizer_id?: string;
  status: 'draft' | 'published' | 'cancelled' | string;
  created_at?: string;
  updated_at?: string;
  images?: EventImage[];
  ticket_types: TicketType[];
  ticketTypes?: TicketType[];
  category?: string;
  poster_image?: string;
  seatMap?: any;
  seat_map_id?: string;
  time?: string;
  schedule?: EventScheduleItem[];
  organizer?: EventOrganizer;
  teams?: {
    team1: Team;
    team2: Team;
  };
  source?: string;
  featured?: boolean;
}

/**
 * IPL Match specific ticket type
 */
export interface IPLTicketType {
  category: string;
  price: number;
  available: number;
  capacity: number;
}

/**
 * IPL Match (specialized event type)
 */
export interface IPLMatch extends Omit<Event, 'location' | 'ticket_types' | 'ticketTypes'> {
  teams: {
    team1: Team;
    team2: Team;
  };
  venue: string;
  time: string;
  duration?: string;
  ticketTypes: IPLTicketType[];
  category: string;
  featured?: boolean;
  posterImage?: string;
}

/**
 * Event list response from API
 */
export interface EventListResponse {
  events: (Event | IPLMatch)[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Filters for event listing
 */
export interface EventFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Input for creating/updating events
 */
export interface EventInput {
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location: string;
  status: 'draft' | 'published' | 'cancelled';
  images: {
    url: string;
    alt_text?: string;
    is_featured: boolean;
  }[];
  ticket_types: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
  }[];
  category?: string;
  organizer_id?: string;
  seat_map_id?: string;
  teams?: {
    team1: {
      name: string;
      shortName: string;
      logo: string;
    };
    team2: {
      name: string;
      shortName: string;
      logo: string;
    };
  };
} 