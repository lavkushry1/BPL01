/**
 * IPL 2026 Routes
 * API endpoints for IPL teams, matches, and venues
 */

import { Request, Response, Router } from 'express';
import { IplService } from '../services/ipl.service';

const router = Router();

/**
 * @swagger
 * /api/v1/ipl/teams:
 *   get:
 *     summary: Get all IPL teams
 *     tags: [IPL]
 *     parameters:
 *       - in: query
 *         name: includeVenue
 *         schema:
 *           type: boolean
 *         description: Include home venue details
 *     responses:
 *       200:
 *         description: List of IPL teams
 */
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const includeVenue = req.query.includeVenue === 'true';
    const teams = await IplService.getAllTeams(includeVenue);
    res.json({ success: true, data: teams });
  } catch (error) {
    console.error('Error fetching IPL teams:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch teams' });
  }
});

/**
 * @swagger
 * /api/v1/ipl/teams/{id}:
 *   get:
 *     summary: Get team by ID or short name
 *     tags: [IPL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID or short name (e.g., CSK, MI)
 *     responses:
 *       200:
 *         description: Team details with upcoming matches
 *       404:
 *         description: Team not found
 */
router.get('/teams/:id', async (req: Request, res: Response) => {
  try {
    const team = await IplService.getTeamById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    res.json({ success: true, data: team });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch team' });
  }
});

/**
 * @swagger
 * /api/v1/ipl/venues:
 *   get:
 *     summary: Get all IPL venues
 *     tags: [IPL]
 *     responses:
 *       200:
 *         description: List of IPL venues
 */
router.get('/venues', async (_req: Request, res: Response) => {
  try {
    const venues = await IplService.getAllVenues();
    res.json({ success: true, data: venues });
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch venues' });
  }
});

/**
 * @swagger
 * /api/v1/ipl/venues/{id}:
 *   get:
 *     summary: Get venue by ID or city
 *     tags: [IPL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue ID or city name
 *     responses:
 *       200:
 *         description: Venue details with upcoming matches
 *       404:
 *         description: Venue not found
 */
router.get('/venues/:id', async (req: Request, res: Response) => {
  try {
    const venue = await IplService.getVenueById(req.params.id);
    if (!venue) {
      return res.status(404).json({ success: false, error: 'Venue not found' });
    }
    res.json({ success: true, data: venue });
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch venue' });
  }
});

/**
 * @swagger
 * /api/v1/ipl/matches:
 *   get:
 *     summary: Get all IPL matches with filters
 *     tags: [IPL]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: team
 *         schema:
 *           type: string
 *         description: Filter by team short name (e.g., CSK)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UPCOMING, LIVE, COMPLETED, CANCELLED]
 *         description: Filter by match status
 *     responses:
 *       200:
 *         description: List of IPL matches
 */
router.get('/matches', async (req: Request, res: Response) => {
  try {
    const { city, team, status } = req.query;

    let matches;
    if (team) {
      matches = await IplService.getMatchesByTeam(team as string);
    } else if (city) {
      matches = await IplService.getMatchesByCity(city as string);
    } else {
      matches = await IplService.getMatches({
        status: status as 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | undefined
      });
    }

    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch matches' });
  }
});

/**
 * @swagger
 * /api/v1/ipl/matches/upcoming:
 *   get:
 *     summary: Get upcoming matches for homepage
 *     tags: [IPL]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of matches to return
 *     responses:
 *       200:
 *         description: List of upcoming IPL matches
 */
router.get('/matches/upcoming', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const matches = await IplService.getUpcomingMatchesSummary(limit);
    res.json({ success: true, data: matches });
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch upcoming matches' });
  }
});

/**
 * @swagger
 * /api/v1/ipl/matches/{id}:
 *   get:
 *     summary: Get match by ID
 *     tags: [IPL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match details with ticket info
 *       404:
 *         description: Match not found
 */
router.get('/matches/:id', async (req: Request, res: Response) => {
  try {
    const match = await IplService.getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }
    res.json({ success: true, data: match });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch match' });
  }
});

/**
 * @swagger
 * /api/v1/ipl/cities:
 *   get:
 *     summary: Get cities with upcoming matches
 *     tags: [IPL]
 *     responses:
 *       200:
 *         description: List of cities with match counts
 */
router.get('/cities', async (_req: Request, res: Response) => {
  try {
    const cities = await IplService.getCitiesWithMatches();
    res.json({ success: true, data: cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cities' });
  }
});

/**
 * @swagger
 * /api/v1/ipl/matches/{id}/pricing:
 *   get:
 *     summary: Get dynamic pricing for all sections of a match
 *     tags: [IPL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Pricing preview for all stadium sections
 */
router.get('/matches/:id/pricing', async (req: Request, res: Response) => {
  try {
    // Lazy import to avoid circular dependencies
    const { IplPricingService } = await import('../services/iplPricing.service');
    const pricing = await IplPricingService.getMatchPricingPreview(req.params.id);
    res.json({ success: true, data: pricing });
  } catch (error) {
    console.error('Error calculating match pricing:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate pricing' });
  }
});

/**
 * @swagger
 * /api/v1/ipl/high-demand:
 *   get:
 *     summary: Get high-demand matches for featured section
 *     tags: [IPL]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: List of high-demand match IDs
 */
router.get('/high-demand', async (req: Request, res: Response) => {
  try {
    const { IplPricingService } = await import('../services/iplPricing.service');
    const limit = parseInt(req.query.limit as string) || 5;
    const matchIds = await IplPricingService.getHighDemandMatches(limit);
    res.json({ success: true, data: matchIds });
  } catch (error) {
    console.error('Error fetching high-demand matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch high-demand matches' });
  }
});

export default router;
