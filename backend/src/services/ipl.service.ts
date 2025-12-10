/**
 * IPL 2026 Service
 * Handles all IPL-related data operations including teams, matches, and venues
 */

import { MatchStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface IplMatchFilters {
  city?: string;
  teamId?: string;
  status?: MatchStatus;
  startDate?: Date;
  endDate?: Date;
}

export class IplService {
  /**
   * Get all IPL teams with optional venue info
   */
  static async getAllTeams(includeVenue = false) {
    return prisma.iplTeam.findMany({
      include: {
        homeVenue: includeVenue
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Get a single team by ID or short name
   */
  static async getTeamById(identifier: string) {
    return prisma.iplTeam.findFirst({
      where: {
        OR: [
          { id: identifier },
          { shortName: identifier.toUpperCase() }
        ]
      },
      include: {
        homeVenue: true,
        homeMatches: {
          take: 5,
          orderBy: { matchDate: 'asc' },
          where: { status: MatchStatus.UPCOMING },
          include: {
            awayTeam: true,
            venue: true
          }
        }
      }
    });
  }

  /**
   * Get all IPL venues
   */
  static async getAllVenues() {
    return prisma.iplVenue.findMany({
      include: {
        teams: {
          select: { id: true, shortName: true, name: true, primaryColor: true }
        }
      },
      orderBy: {
        city: 'asc'
      }
    });
  }

  /**
   * Get a single venue by ID or city
   */
  static async getVenueById(identifier: string) {
    return prisma.iplVenue.findFirst({
      where: {
        OR: [
          { id: identifier },
          { city: identifier }
        ]
      },
      include: {
        teams: true,
        matches: {
          take: 10,
          orderBy: { matchDate: 'asc' },
          where: { status: MatchStatus.UPCOMING },
          include: {
            homeTeam: true,
            awayTeam: true
          }
        }
      }
    });
  }

  /**
   * Get all IPL matches with filters
   */
  static async getMatches(filters: IplMatchFilters = {}) {
    const where: Record<string, unknown> = {};

    if (filters.city) {
      where.venue = { city: filters.city };
    }

    if (filters.teamId) {
      where.OR = [
        { homeTeamId: filters.teamId },
        { awayTeamId: filters.teamId }
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.matchDate = {};
      if (filters.startDate) {
        (where.matchDate as Record<string, Date>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (where.matchDate as Record<string, Date>).lte = filters.endDate;
      }
    }

    return prisma.iplMatch.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: {
          select: { id: true, name: true, shortName: true, city: true, capacity: true }
        }
      },
      orderBy: {
        matchDate: 'asc'
      }
    });
  }

  /**
   * Get a single match by ID
   */
  static async getMatchById(id: string) {
    return prisma.iplMatch.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true,
        event: {
          include: {
            ticketCategories: true,
            seats: {
              where: { status: 'AVAILABLE' },
              take: 100
            }
          }
        }
      }
    });
  }

  /**
   * Get matches by city (for district-based filtering)
   */
  static async getMatchesByCity(city: string) {
    return this.getMatches({ city });
  }

  /**
   * Get matches by team
   */
  static async getMatchesByTeam(teamShortName: string) {
    const team = await prisma.iplTeam.findUnique({
      where: { shortName: teamShortName.toUpperCase() }
    });

    if (!team) return [];

    return this.getMatches({ teamId: team.id });
  }

  /**
   * Get distinct cities with upcoming matches
   */
  static async getCitiesWithMatches() {
    const venues = await prisma.iplVenue.findMany({
      where: {
        matches: {
          some: { status: MatchStatus.UPCOMING }
        }
      },
      select: {
        city: true,
        state: true,
        _count: {
          select: { matches: true }
        }
      }
    });

    return venues.map(v => ({
      city: v.city,
      state: v.state,
      matchCount: v._count.matches
    }));
  }

  /**
   * Get upcoming matches summary for homepage
   */
  static async getUpcomingMatchesSummary(limit = 5) {
    return prisma.iplMatch.findMany({
      where: {
        status: MatchStatus.UPCOMING,
        matchDate: { gte: new Date() }
      },
      include: {
        homeTeam: {
          select: { id: true, shortName: true, name: true, primaryColor: true, logoUrl: true }
        },
        awayTeam: {
          select: { id: true, shortName: true, name: true, primaryColor: true, logoUrl: true }
        },
        venue: {
          select: { id: true, shortName: true, city: true }
        }
      },
      orderBy: {
        matchDate: 'asc'
      },
      take: limit
    });
  }
}

export default IplService;
