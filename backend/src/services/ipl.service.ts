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
        stands: true,
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
   * Get a single match by ID - Returns formatted data for frontend
   */
  static async getMatchById(id: string) {
    const match = await prisma.iplMatch.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: {
          include: {
            stands: true
          }
        },
        event: {
          include: {
            ticketCategories: {
              where: { isDeleted: false },
              orderBy: { price: 'asc' }
            },
            eventSummary: true,
            seats: {
              where: { status: 'AVAILABLE' },
              take: 100
            }
          }
        }
      }
    });

    if (!match) return null;

    // Transform to frontend-expected format
    const ticketCategories = match.event?.ticketCategories?.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      price: Number(cat.price),
      available: cat.available ?? (cat.totalSeats - cat.bookedSeats),
      totalSeats: cat.totalSeats,
      bookedSeats: cat.bookedSeats
    })) || [];

    return {
      id: match.id,
      eventId: match.eventId,
      matchNumber: match.matchNumber,
      title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      description: match.event?.description || `IPL 2026 Match ${match.matchNumber}`,
      date: match.matchDate.toISOString(),
      time: match.matchTime,
      venue: match.venue.name,
      bannerImage: match.venue.imageUrl || `/assets/stadiums/${match.venue.city.toLowerCase()}.jpg`,
      status: match.status,
      priceMultiplier: Number(match.priceMultiplier),
      isPlayoff: match.isPlayoff,
      teams: {
        team1: {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logo: match.homeTeam.logoUrl,
          primaryColor: match.homeTeam.primaryColor,
          secondaryColor: match.homeTeam.secondaryColor
        },
        team2: {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logo: match.awayTeam.logoUrl,
          primaryColor: match.awayTeam.primaryColor,
          secondaryColor: match.awayTeam.secondaryColor
        }
      },
      venueDetails: {
        id: match.venue.id,
        name: match.venue.name,
        shortName: match.venue.shortName,
        city: match.venue.city,
        state: match.venue.state,
        capacity: match.venue.capacity,
        imageUrl: match.venue.imageUrl,
        stands: (match.venue as any).stands || []
      },
      ticketCategories,
      pricing: {
        minPrice: match.event?.eventSummary?.minPrice ? Number(match.event.eventSummary.minPrice) : Math.min(...ticketCategories.map(tc => tc.price)),
        maxPrice: match.event?.eventSummary?.maxPrice ? Number(match.event.eventSummary.maxPrice) : Math.max(...ticketCategories.map(tc => tc.price))
      },
      availability: {
        totalSeats: match.event?.eventSummary?.totalSeats || match.venue.capacity,
        bookedSeats: match.event?.eventSummary?.bookedSeats || 0,
        availableSeats: match.event?.eventSummary?.availableSeats || match.venue.capacity
      }
    };
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
  static async getSeatsByMatchId(matchId: string, standId?: string) {
    const match = await prisma.iplMatch.findUnique({
      where: { id: matchId },
      include: { event: true }
    });

    if (!match || !match.event) return [];

    let tierFilter = {};
    if (standId) {
      const stand = await prisma.iplStand.findUnique({ where: { id: standId } });
      if (stand) {
        tierFilter = { tier: stand.code };
      }
    }

    return prisma.seat.findMany({
      where: {
        eventId: match.event.id,
        ...tierFilter
      },
      orderBy: [
        { row: 'asc' },
        { seatNumber: 'asc' }
      ]
    });
  }
}

export default IplService;
