/**
 * IPL Dynamic Pricing Service
 *
 * Calculates ticket prices based on:
 * - Match rivalry (CSK vs MI = 2x multiplier)
 * - Playoff matches (1.5x multiplier)
 * - Venue capacity utilization (surge pricing)
 * - Days until match (early bird / last minute)
 * - Team popularity rankings
 */

import { MatchStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Team popularity rankings (higher = more popular = higher demand)
const TEAM_POPULARITY: Record<string, number> = {
  'CSK': 10,   // Chennai Super Kings - highest fan base
  'MI': 9,    // Mumbai Indians - most successful team
  'RCB': 9,   // Royal Challengers Bengaluru - Virat Kohli factor
  'KKR': 8,   // Kolkata Knight Riders
  'DC': 7,    // Delhi Capitals
  'SRH': 7,   // Sunrisers Hyderabad
  'RR': 6,    // Rajasthan Royals
  'PBKS': 6,  // Punjab Kings
  'GT': 7,    // Gujarat Titans - new but successful
  'LSG': 6    // Lucknow Super Giants - newest team
};

// Major rivalries that command premium pricing
const RIVALRY_MULTIPLIERS: Record<string, number> = {
  'CSK-MI': 2.0,   // El Clasico of IPL
  'MI-CSK': 2.0,
  'RCB-CSK': 1.5,  // South India derby
  'CSK-RCB': 1.5,
  'KKR-RCB': 1.3,  // Historic rivalry
  'RCB-KKR': 1.3,
  'MI-RCB': 1.4,   // Big city clash
  'RCB-MI': 1.4,
  'DC-KKR': 1.2,   // Capital rivalry
  'KKR-DC': 1.2
};

export interface IplPricingResult {
  basePrice: number;
  finalPrice: number;
  priceMultiplier: number;
  breakdown: {
    rivalryMultiplier: number;
    playoffMultiplier: number;
    demandMultiplier: number;
    timingMultiplier: number;
  };
  savings?: number;
  premiumReason?: string;
}

export class IplPricingService {

  /**
   * Calculate final ticket price for an IPL match
   */
  static async calculateMatchPrice(
    matchId: string,
    sectionBasePrice: number,
    daysUntilMatch?: number
  ): Promise<IplPricingResult> {
    // Get match details
    const match = await prisma.iplMatch.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        venue: true
      }
    });

    if (!match) {
      return {
        basePrice: sectionBasePrice,
        finalPrice: sectionBasePrice,
        priceMultiplier: 1.0,
        breakdown: {
          rivalryMultiplier: 1.0,
          playoffMultiplier: 1.0,
          demandMultiplier: 1.0,
          timingMultiplier: 1.0
        }
      };
    }

    // Calculate days until match if not provided
    if (daysUntilMatch === undefined) {
      const matchDate = new Date(match.matchDate);
      const now = new Date();
      daysUntilMatch = Math.ceil((matchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Get existing price multiplier from database
    const dbMultiplier = parseFloat(match.priceMultiplier?.toString() || '1');

    // Calculate rivalry multiplier
    const rivalryKey = `${match.homeTeam.shortName}-${match.awayTeam.shortName}`;
    const rivalryMultiplier = RIVALRY_MULTIPLIERS[rivalryKey] || 1.0;

    // Playoff multiplier
    const playoffMultiplier = match.isPlayoff ? 1.5 : 1.0;

    // Demand multiplier based on team popularity
    const homePopularity = TEAM_POPULARITY[match.homeTeam.shortName] || 5;
    const awayPopularity = TEAM_POPULARITY[match.awayTeam.shortName] || 5;
    const avgPopularity = (homePopularity + awayPopularity) / 2;
    const demandMultiplier = 0.8 + (avgPopularity / 10) * 0.4; // Range: 0.8 - 1.2

    // Timing multiplier (early bird discount, last minute surge)
    let timingMultiplier = 1.0;
    let timingReason = '';

    if (daysUntilMatch > 30) {
      timingMultiplier = 0.85; // Early bird 15% discount
      timingReason = 'Early Bird Discount';
    } else if (daysUntilMatch > 14) {
      timingMultiplier = 0.95; // 5% discount
      timingReason = 'Advance Booking Discount';
    } else if (daysUntilMatch <= 3 && daysUntilMatch > 0) {
      timingMultiplier = 1.2; // Last minute surge
      timingReason = 'Last Minute Surge';
    } else if (daysUntilMatch === 0) {
      timingMultiplier = 1.3; // Match day premium
      timingReason = 'Match Day Premium';
    }

    // Calculate final multiplier
    const totalMultiplier = Math.max(dbMultiplier, rivalryMultiplier) *
                           playoffMultiplier *
                           demandMultiplier *
                           timingMultiplier;

    const finalPrice = Math.round(sectionBasePrice * totalMultiplier);

    // Determine premium reason
    let premiumReason: string | undefined;
    if (rivalryMultiplier > 1.2) {
      premiumReason = `${match.homeTeam.shortName} vs ${match.awayTeam.shortName} - High Demand Derby`;
    } else if (match.isPlayoff) {
      premiumReason = 'Playoff Match - Limited Tickets';
    } else if (timingMultiplier > 1) {
      premiumReason = timingReason;
    }

    return {
      basePrice: sectionBasePrice,
      finalPrice,
      priceMultiplier: parseFloat(totalMultiplier.toFixed(2)),
      breakdown: {
        rivalryMultiplier: parseFloat(rivalryMultiplier.toFixed(2)),
        playoffMultiplier,
        demandMultiplier: parseFloat(demandMultiplier.toFixed(2)),
        timingMultiplier: parseFloat(timingMultiplier.toFixed(2))
      },
      savings: finalPrice < sectionBasePrice ? sectionBasePrice - finalPrice : undefined,
      premiumReason
    };
  }

  /**
   * Get price preview for all sections of a match
   */
  static async getMatchPricingPreview(matchId: string): Promise<{
    matchId: string;
    sections: Array<{
      name: string;
      basePrice: number;
      finalPrice: number;
      multiplier: number;
      available: number;
    }>;
    averageMultiplier: number;
  }> {
    // Default stadium sections with base prices
    const sections = [
      { name: 'Pavilion Stand', basePrice: 15000, available: 3200 },
      { name: 'North Stand A', basePrice: 8000, available: 4500 },
      { name: 'North Stand B', basePrice: 8000, available: 5100 },
      { name: 'East Stand', basePrice: 4000, available: 7200 },
      { name: 'West Stand', basePrice: 4000, available: 6800 },
      { name: 'South Stand A', basePrice: 2000, available: 5600 },
      { name: 'South Stand B', basePrice: 2000, available: 5900 },
      { name: 'Ground Level', basePrice: 25000, available: 800 }
    ];

    const pricedSections = await Promise.all(
      sections.map(async (section) => {
        const pricing = await this.calculateMatchPrice(matchId, section.basePrice);
        return {
          name: section.name,
          basePrice: section.basePrice,
          finalPrice: pricing.finalPrice,
          multiplier: pricing.priceMultiplier,
          available: section.available
        };
      })
    );

    const avgMultiplier = pricedSections.reduce((sum, s) => sum + s.multiplier, 0) / pricedSections.length;

    return {
      matchId,
      sections: pricedSections,
      averageMultiplier: parseFloat(avgMultiplier.toFixed(2))
    };
  }

  /**
   * Get high-demand matches (for featured section)
   */
  static async getHighDemandMatches(limit = 5): Promise<string[]> {
    const matches = await prisma.iplMatch.findMany({
      where: { status: MatchStatus.UPCOMING },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    });

    // Score matches by demand
    const scoredMatches = matches.map(match => {
      const rivalryKey = `${match.homeTeam.shortName}-${match.awayTeam.shortName}`;
      const rivalryScore = RIVALRY_MULTIPLIERS[rivalryKey] || 1.0;
      const popularity = (TEAM_POPULARITY[match.homeTeam.shortName] || 5) +
                        (TEAM_POPULARITY[match.awayTeam.shortName] || 5);
      const playoffBonus = match.isPlayoff ? 5 : 0;

      return {
        id: match.id,
        score: rivalryScore * 10 + popularity + playoffBonus
      };
    });

    // Sort by score and return top N
    return scoredMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(m => m.id);
  }
}

export default IplPricingService;
