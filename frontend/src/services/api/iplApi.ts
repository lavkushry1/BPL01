/**
 * IPL 2026 API Service
 * Frontend API client for IPL teams, matches, venues, and city filtering
 */

import { defaultApiClient } from './apiUtils';
import { unwrapApiResponse } from './responseUtils';

// IPL Team Type
export interface IplTeam {
  id: string;
  name: string;
  shortName: string;
  homeCity: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  foundedYear: number | null;
  homeVenue?: IplVenue;
}

// IPL Venue Type
export interface IplVenue {
  id: string;
  name: string;
  shortName: string | null;
  city: string;
  state: string;
  capacity: number;
  imageUrl: string | null;
  svgLayout?: string | null;
}

// IPL Match Type
export interface IplMatch {
  id: string;
  matchNumber: number;
  homeTeam: IplTeam;
  awayTeam: IplTeam;
  venue: IplVenue;
  matchDate: string;
  matchTime: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  priceMultiplier: number;
  isPlayoff: boolean;
  eventId?: string | null;
}

export interface IplStand {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity: number;
  priceDefault: number;
  svgPath: string;
  viewBox?: string;
}

export interface IplMatchDetail extends Omit<IplMatch, 'venue'> {
  venue: string; // Name string in detail view
  venueDetails: IplVenue & { stands: IplStand[] };
  ticketCategories: any[];
  pricing: { minPrice: number; maxPrice: number };
  availability: { totalSeats: number; bookedSeats: number; availableSeats: number };
  bannerImage: string;
  teams: {
    team1: IplTeam;
    team2: IplTeam;
  };
}

// City with match count
export interface CityWithMatches {
  city: string;
  state: string;
  matchCount: number;
}

/**
 * Get all IPL teams
 */
export const getIplTeams = async (includeVenue = false): Promise<IplTeam[]> => {
  try {
    const response = await defaultApiClient.get('/ipl/teams', {
      params: { includeVenue }
    });
    return unwrapApiResponse<IplTeam[]>(response) || [];
  } catch (error) {
    console.error('Error fetching IPL teams:', error);
    return [];
  }
};

/**
 * Get a team by ID or short name
 */
export const getIplTeamById = async (id: string): Promise<IplTeam | null> => {
  try {
    const response = await defaultApiClient.get(`/ipl/teams/${id}`);
    return unwrapApiResponse<IplTeam>(response) || null;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
};

/**
 * Get all IPL venues
 */
export const getIplVenues = async (): Promise<IplVenue[]> => {
  try {
    const response = await defaultApiClient.get('/ipl/venues');
    return unwrapApiResponse<IplVenue[]>(response) || [];
  } catch (error) {
    console.error('Error fetching venues:', error);
    return [];
  }
};

/**
 * Get a venue by ID or city
 */
export const getIplVenueById = async (id: string): Promise<IplVenue | null> => {
  try {
    const response = await defaultApiClient.get(`/ipl/venues/${id}`);
    return unwrapApiResponse<IplVenue>(response) || null;
  } catch (error) {
    console.error('Error fetching venue:', error);
    return null;
  }
};

/**
 * Get IPL matches with optional filters
 */
export const getIplMatches = async (filters?: {
  city?: string;
  team?: string;
  status?: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
}): Promise<IplMatch[]> => {
  try {
    const response = await defaultApiClient.get('/ipl/matches', {
      params: filters
    });
    return unwrapApiResponse<IplMatch[]>(response) || [];
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
};

/**
 * Get upcoming matches for homepage
 */
export const getUpcomingIplMatches = async (limit = 5): Promise<IplMatch[]> => {
  try {
    const response = await defaultApiClient.get('/ipl/matches/upcoming', {
      params: { limit }
    });
    return unwrapApiResponse<IplMatch[]>(response) || [];
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return [];
  }
};

/**
 * Get a match by ID
 */
export const getIplMatchById = async (id: string): Promise<IplMatchDetail | null> => {
  try {
    const response = await defaultApiClient.get(`/ipl/matches/${id}`);
    return unwrapApiResponse<IplMatch>(response) || null;
  } catch (error) {
    console.error('Error fetching match:', error);
    return null;
  }
};

/**
 * Get cities with upcoming matches (for district filter)
 */
export const getCitiesWithMatches = async (): Promise<CityWithMatches[]> => {
  try {
    const response = await defaultApiClient.get('/ipl/cities');
    return unwrapApiResponse<CityWithMatches[]>(response) || [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

export default {
  getIplTeams,
  getIplTeamById,
  getIplVenues,
  getIplVenueById,
  getIplMatches,
  getUpcomingIplMatches,
  getIplMatchById,
  getCitiesWithMatches
};
