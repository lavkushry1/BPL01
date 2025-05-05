import { Router } from 'express';
import { UpiPaymentController } from '../../controllers/upiPayment.controller';
import { auth } from '../../middleware/auth';
import { validate } from '../../middlewares/validation.middleware';
import { upiPaymentValidation } from '../../validations/upiPayment.validations';

const router = Router();

// Initiate payment
router.post(
    '/initiate',
    auth(),
    validate(upiPaymentValidation.initiatePayment),
    UpiPaymentController.initiatePayment
);

// Check payment status
router.get(
    '/status/:sessionId',
    auth(),
    validate(upiPaymentValidation.getPaymentStatus, 'params'),
    UpiPaymentController.getPaymentStatus
);

// Confirm payment
router.post(
    '/confirm',
    auth(),
    validate(upiPaymentValidation.confirmPayment),
    UpiPaymentController.confirmPayment
);

export default router; 