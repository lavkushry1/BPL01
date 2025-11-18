import express from 'express';
import { metricsController } from '../controllers/metricsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Record mobile performance metrics
router.post('/mobile', metricsController.recordMobileMetrics);

// Get aggregated metrics (requires authentication)
router.get('/mobile/aggregate', authenticate, metricsController.getAggregatedMetrics);

// Get session metrics (requires authentication)
router.get('/mobile/session/:sessionId', authenticate, metricsController.getSessionMetrics);

export default router;