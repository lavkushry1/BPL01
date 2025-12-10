/**
 * IPL 2026 API Service
 * Frontend API client for IPL teams, matches, venues, and city filtering
 */

import apiClient from './axios-client';

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

// City with match count
export interface CityWithMatches {
  city: string;
  state: string;
  matchCount: number;
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

/**
 * Get all IPL teams
 */
export const getIplTeams = async (includeVenue = false): Promise<IplTeam[]> => {
  const { data } = await apiClient.get<ApiResponse<IplTeam[]>>('/ipl/teams', {
    params: { includeVenue }
  });
  return data.data;
};

/**
 * Get a team by ID or short name
 */
export const getIplTeamById = async (id: string): Promise<IplTeam> => {
  const { data } = await apiClient.get<ApiResponse<IplTeam>>(`/ipl/teams/${id}`);
  return data.data;
};

/**
 * Get all IPL venues
 */
export const getIplVenues = async (): Promise<IplVenue[]> => {
  const { data } = await apiClient.get<ApiResponse<IplVenue[]>>('/ipl/venues');
  return data.data;
};

/**
 * Get a venue by ID or city
 */
export const getIplVenueById = async (id: string): Promise<IplVenue> => {
  const { data } = await apiClient.get<ApiResponse<IplVenue>>(`/ipl/venues/${id}`);
  return data.data;
};

/**
 * Get IPL matches with optional filters
 */
export const getIplMatches = async (filters?: {
  city?: string;
  team?: string;
  status?: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
}): Promise<IplMatch[]> => {
  const { data } = await apiClient.get<ApiResponse<IplMatch[]>>('/ipl/matches', {
    params: filters
  });
  return data.data;
};

/**
 * Get upcoming matches for homepage
 */
export const getUpcomingIplMatches = async (limit = 5): Promise<IplMatch[]> => {
  const { data } = await apiClient.get<ApiResponse<IplMatch[]>>('/ipl/matches/upcoming', {
    params: { limit }
  });
  return data.data;
};

/**
 * Get a match by ID
 */
export const getIplMatchById = async (id: string): Promise<IplMatch> => {
  const { data } = await apiClient.get<ApiResponse<IplMatch>>(`/ipl/matches/${id}`);
  return data.data;
};

/**
 * Get cities with upcoming matches (for district filter)
 */
export const getCitiesWithMatches = async (): Promise<CityWithMatches[]> => {
  const { data } = await apiClient.get<ApiResponse<CityWithMatches[]>>('/ipl/cities');
  return data.data;
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
