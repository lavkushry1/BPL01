"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservationController = __importStar(require("../controllers/reservationController"));
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const prisma_1 = require("../db/prisma");
const paymentValidation = __importStar(require("../validations/payment.validation"));
const router = (0, express_1.Router)();
// UTR verification endpoints
router.post('/verify', auth_1.authenticate, (0, validate_1.validate)(paymentValidation.verifyPaymentUtrSchema), reservationController.verifyUTR);
router.get('/status/:utr', auth_1.authenticate, async (req, res) => {
    try {
        const payment = await prisma_1.prisma.bookingPayment.findFirst({
            where: { utrNumber: req.params.utr },
            include: {
                booking: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                }
            }
        });
        if (!payment) {
            return res.status(404).json({
                error: 'UTR not found',
                utr: req.params.utr
            });
        }
        res.json({
            utr: req.params.utr,
            status: payment.status,
            eventId: payment.booking.eventId,
            eventTitle: payment.booking.event?.title,
            amount: Number(payment.amount),
            verifiedAt: payment.updatedAt
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'UTR verification service operational' });
});
exports.default = router;
//# sourceMappingURL=utrVerification.routes.js.map