import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '@/middleware/auth';
import * as adminEventCtrl from '@/controllers/admin/event.controller';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// CRUD routes for events
router.get('/', adminEventCtrl.listEvents);       // GET /api/admin/events
router.post('/', adminEventCtrl.createEvent);     // POST /api/admin/events 
router.get('/:id', adminEventCtrl.getEventById);  // GET /api/admin/events/:id
router.put('/:id', adminEventCtrl.updateEvent);   // PUT /api/admin/events/:id
router.delete('/:id', adminEventCtrl.deleteEvent); // DELETE /api/admin/events/:id

export default router; 