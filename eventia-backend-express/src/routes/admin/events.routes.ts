import express from 'express';
import * as adminEventCtrl from '../../controllers/admin/event.controller';
import { EventController } from '../../controllers/event.controller';

const router = express.Router();

// GET /api/v1/admin/events
router.get('/', adminEventCtrl.getAllEvents);

// GET /api/v1/admin/events/:id
router.get('/:id', adminEventCtrl.getEventById);

// POST /api/v1/admin/events
router.post('/', adminEventCtrl.createEvent);

// PUT /api/v1/admin/events/:id
router.put('/:id', adminEventCtrl.updateEvent);

// DELETE /api/v1/admin/events/:id
router.delete('/:id', adminEventCtrl.deleteEvent);

// Fallback to the main EventController for any operations not implemented
// in the admin controller
router.post('/fallback', EventController.createEvent);
router.put('/fallback/:id', EventController.updateEvent);
router.delete('/fallback/:id', EventController.deleteEvent);

export default router; 