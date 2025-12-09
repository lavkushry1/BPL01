import { Router } from 'express';
import { db } from '../db';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: API is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       example: 3600
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                     memory:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: string
 *                           example: 50MB
 *                         heapTotal:
 *                           type: string
 *                           example: 20MB
 *                         heapUsed:
 *                           type: string
 *                           example: 15MB
 *       503:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 statusCode:
 *                   type: integer
 *                   example: 503
 *                 message:
 *                   type: string
 *                   example: Service unavailable
 *                 data:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: disconnected
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    let dbStatus = 'disconnected';
    let isHealthy = false;
    
    try {
      // Simple query to check if DB is responsive
      await db.raw('SELECT 1');
      dbStatus = 'connected';
      isHealthy = true;
    } catch (dbError) {
      logger.error('Health check - Database connection failed:', dbError);
      isHealthy = false;
    }
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const formatMemory = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`;
    
    const healthData = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus
      },
      memory: {
        rss: formatMemory(memoryUsage.rss),
        heapTotal: formatMemory(memoryUsage.heapTotal),
        heapUsed: formatMemory(memoryUsage.heapUsed)
      },
      environment: process.env.NODE_ENV
    };
    
    if (isHealthy) {
      // Return 200 if everything is OK
      ApiResponse.success(res, 200, 'API is healthy', healthData);
    } else {
      // Return 503 if any dependency is not healthy
      res.status(503).json({
        status: 'error',
        statusCode: 503,
        message: 'Service unavailable',
        data: healthData
      });
    }
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      statusCode: 503,
      message: 'Health check failed',
      data: {
        error: (error as Error).message
      }
    });
  }
});

/**
 * @swagger
 * /api/v1/health/metrics:
 *   get:
 *     summary: Prometheus metrics endpoint
 *     description: Returns metrics in Prometheus format
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Metrics exported successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/metrics', (req, res) => {
  // Build basic metrics in Prometheus format
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  const metrics = [
    '# HELP api_uptime_seconds The uptime of the API in seconds',
    '# TYPE api_uptime_seconds gauge',
    `api_uptime_seconds ${uptime}`,
    '',
    '# HELP api_memory_usage_bytes Memory usage of the API in bytes',
    '# TYPE api_memory_usage_bytes gauge',
    `api_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`,
    `api_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}`,
    `api_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}`,
    '',
    '# HELP api_http_requests_total Total number of HTTP requests',
    '# TYPE api_http_requests_total counter',
    // Add request counters here when implemented
  ].join('\n');
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

export default router; 