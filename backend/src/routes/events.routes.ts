import { Router } from 'express';
import * as eventController from '../controllers/event.controller';

const router = Router();

// Public event routes
router.get('/', eventController.listPublicEvents);        // GET /api/events
router.get('/ipl', eventController.listIPLMatches);       // GET /api/events/ipl
router.get('/categories', eventController.listCategories); // GET /api/events/categories
router.get('/:id', eventController.getPublicEventById);   // GET /api/events/:id

export default router;
