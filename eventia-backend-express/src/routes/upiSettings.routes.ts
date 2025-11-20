import { Router } from 'express';
import { UpiSettingsController } from '../controllers/upiSettings.controller';
import { authenticate, checkAdmin } from '../middleware/auth';

const router = Router();

// Public route for getting active UPI setting (for payments)
router.get('/active', UpiSettingsController.getActiveSetting);

// Protected admin routes
router.use(authenticate);
router.use(checkAdmin);

router.get('/', UpiSettingsController.getAllSettings);
router.post('/', UpiSettingsController.createSetting);
router.put('/:id', UpiSettingsController.updateSetting);
router.delete('/:id', UpiSettingsController.deleteSetting);

export default router;
