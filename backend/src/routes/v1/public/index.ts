import { Router } from 'express';
import { registerRoutes } from '../../../utils/routeHelper';
import upiRoutes from './upi.routes';

const router = Router();

// Register all public routes
registerRoutes(router, {
  'upi': upiRoutes
});

export default router; 