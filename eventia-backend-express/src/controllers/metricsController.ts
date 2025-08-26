import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Controller for handling performance metrics
 */
export const metricsController = {
  /**
   * Record mobile performance metrics
   * @route POST /api/v1/metrics/mobile
   */
  recordMobileMetrics: async (req: Request, res: Response) => {
    try {
      const { sessionId, timestamp, url, userAgent, metrics } = req.body;

      if (!sessionId || !metrics) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Store metrics in database
      const record = await prisma.performanceMetric.create({
        data: {
          sessionId,
          timestamp: new Date(timestamp),
          url,
          userAgent,
          // Store metrics as JSON
          metricsData: metrics,
          // Extract key metrics for querying
          fcp: metrics.fcp,
          lcp: metrics.lcp,
          cls: metrics.cls,
          fid: metrics.fid,
          memoryUsage: metrics.memoryUsage,
          networkType: metrics.networkType,
          deviceType: 'mobile', // Default to mobile for this endpoint
        },
      });

      logger.info(`Recorded mobile performance metrics for session ${sessionId}`);
      return res.status(201).json({ success: true, id: record.id });
    } catch (error) {
      logger.error('Error recording mobile performance metrics:', error);
      return res.status(500).json({ error: 'Failed to record metrics' });
    }
  },

  /**
   * Get aggregated performance metrics
   * @route GET /api/v1/metrics/mobile/aggregate
   */
  getAggregatedMetrics: async (req: Request, res: Response) => {
    try {
      const { timeframe = '24h', metric = 'lcp' } = req.query;
      
      // Calculate date range based on timeframe
      const now = new Date();
      let startDate = new Date(now);
      
      switch (timeframe) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '6h':
          startDate.setHours(now.getHours() - 6);
          break;
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate.setDate(now.getDate() - 1); // Default to 24h
      }

      // Get aggregated metrics
      const aggregatedData = await prisma.$queryRaw`
        SELECT 
          AVG("fcp") as "avgFcp",
          AVG("lcp") as "avgLcp",
          AVG("cls") as "avgCls",
          AVG("fid") as "avgFid",
          AVG("memoryUsage") as "avgMemoryUsage",
          COUNT(*) as "totalSessions",
          COUNT(DISTINCT "sessionId") as "uniqueSessions"
        FROM "PerformanceMetric"
        WHERE "timestamp" >= ${startDate}
          AND "deviceType" = 'mobile'
      `;

      // Get percentile data for the specified metric
      const percentileData = await prisma.$queryRaw`
        SELECT 
          PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ${metric}) as "p50",
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${metric}) as "p75",
          PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY ${metric}) as "p90",
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${metric}) as "p95",
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY ${metric}) as "p99"
        FROM "PerformanceMetric"
        WHERE "timestamp" >= ${startDate}
          AND "deviceType" = 'mobile'
          AND ${metric} IS NOT NULL
      `;

      // Get network type distribution
      const networkDistribution = await prisma.performanceMetric.groupBy({
        by: ['networkType'],
        where: {
          timestamp: { gte: startDate },
          deviceType: 'mobile',
          networkType: { not: null },
        },
        _count: true,
      });

      return res.status(200).json({
        timeframe,
        aggregatedData: aggregatedData[0],
        percentileData: percentileData[0],
        networkDistribution: networkDistribution.map(item => ({
          networkType: item.networkType,
          count: item._count,
        })),
      });
    } catch (error) {
      logger.error('Error getting aggregated metrics:', error);
      return res.status(500).json({ error: 'Failed to get metrics' });
    }
  },

  /**
   * Get performance metrics for a specific session
   * @route GET /api/v1/metrics/mobile/session/:sessionId
   */
  getSessionMetrics: async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      const metrics = await prisma.performanceMetric.findMany({
        where: {
          sessionId,
          deviceType: 'mobile',
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (metrics.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      return res.status(200).json({
        sessionId,
        metrics,
      });
    } catch (error) {
      logger.error('Error getting session metrics:', error);
      return res.status(500).json({ error: 'Failed to get session metrics' });
    }
  },
};