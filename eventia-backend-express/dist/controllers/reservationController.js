"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTickets = exports.verifyUTR = exports.processPayment = exports.createReservation = void 0;
const express_validator_1 = require("express-validator");
// Importing services needed for UTR verification
const payment_service_1 = require("../services/payment.service");
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
// Service to handle reservation operations
class ReservationService {
    static async updateReservationStatus(reservationId, status) {
        // TODO: Implement actual database update logic
        console.log(`Updating reservation ${reservationId} to status: ${status}`);
    }
}
// Payment gateway interface
class PaymentGateway {
    static async verifyUTRPayment(utrNumber) {
        // TODO: Implement actual UTR verification with banking API
        // This is a mock implementation that considers a UTR valid if it has 12 digits
        return /^\d{12}$/.test(utrNumber);
    }
}
const createReservation = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { eventId, tickets } = req.body;
        // TODO: Implement actual database integration
        const reservation = {
            eventId,
            tickets,
            totalAmount: calculateTotal(tickets),
            paymentStatus: 'pending'
        };
        res.status(201).json({
            success: true,
            reservationId: 'TEMPORARY_RESERVATION_ID',
            paymentDeadline: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        });
    }
    catch (error) {
        console.error('Reservation error:', error);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
};
exports.createReservation = createReservation;
const processPayment = async (req, res) => {
    // Payment processing logic
};
exports.processPayment = processPayment;
const verifyUTR = async (req, res) => {
    try {
        const { utrNumber, reservationId } = req.body;
        // Validate UTR format
        const isValidUTR = /^\d{12}$/.test(utrNumber);
        if (!isValidUTR) {
            return res.status(400).json({ error: 'Invalid UTR format' });
        }
        // Assume we're getting some payment or null response 
        // Safely convert to our expected type using unknown as an intermediate step
        const rawPayment = await payment_service_1.PaymentService.getPaymentById(utrNumber);
        // Convert to unknown first, then to our Payment interface
        const existingPayment = rawPayment ? {
            id: typeof rawPayment.id === 'string' ? rawPayment.id : '',
            booking_id: typeof rawPayment.bookingId === 'string' ? rawPayment.bookingId : '',
            amount: typeof rawPayment.amount === 'number' ? rawPayment.amount : 0,
            status: typeof rawPayment.status === 'string' ? rawPayment.status : ''
        } : null;
        const isDuplicate = !!existingPayment;
        if (isDuplicate) {
            return res.status(409).json({ error: 'Duplicate UTR detected' });
        }
        // Verify payment with banking API
        const paymentVerified = await PaymentGateway.verifyUTRPayment(utrNumber);
        if (!paymentVerified) {
            return res.status(402).json({ error: 'Payment verification failed' });
        }
        // Update reservation status
        await payment_service_1.PaymentService.createPayment({
            booking_id: reservationId,
            amount: 0, // Default amount if no existing payment
            utr_number: utrNumber
        });
        await ReservationService.updateReservationStatus(reservationId, 'paid');
        res.json({
            success: true,
            message: 'Payment verified successfully',
            verifiedAt: new Date().toISOString(),
            nextSteps: ['generate_tickets']
        });
    }
    catch (error) {
        console.error('UTR verification error:', error);
        res.status(500).json({
            error: 'Payment verification failed',
            details: error.message
        });
    }
};
exports.verifyUTR = verifyUTR;
const generateTickets = async (req, res) => {
    try {
        const { reservationId } = req.body;
        // TODO: Fetch actual reservation data from database
        const mockReservation = {
            eventId: 'EVENT_123',
            eventTitle: 'Sample Event',
            tickets: {
                'Standard': 2,
                'VIP': 1
            },
            totalAmount: 8500,
            userEmail: 'user@example.com'
        };
        // Generate PDF ticket
        const pdfBuffer = await generateTicketPDF(mockReservation);
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=tickets-${reservationId}.pdf`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Ticket generation error:', error);
        res.status(500).json({
            error: 'Failed to generate tickets',
            details: error.message
        });
    }
};
exports.generateTickets = generateTickets;
const generateTicketPDF = async (reservation) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({ margin: 50 });
            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            // Generate QR Code
            const qrData = `EventID:${reservation.eventId}|Email:${reservation.userEmail}`;
            const qrImage = await qrcode_1.default.toBuffer(qrData);
            // Create ticket for each category
            Object.entries(reservation.tickets).forEach(([category, quantity]) => {
                for (let i = 0; i < quantity; i++) {
                    doc.fontSize(18).text(`Event: ${reservation.eventTitle}`);
                    doc.fontSize(12).text(`Category: ${category}`);
                    doc.text(`Ticket ${i + 1} of ${quantity}`);
                    doc.image(qrImage, { width: 100 });
                    doc.moveDown(2);
                }
            });
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
};
const calculateTotal = (tickets) => {
    // Get actual ticket prices from database (mocked here)
    const ticketPrices = {
        'Standard': 1500,
        'VIP': 3500,
        'Premium': 5000
    };
    return Object.entries(tickets).reduce((sum, [category, qty]) => {
        return sum + (qty * (ticketPrices[category] || 0));
    }, 0);
};
