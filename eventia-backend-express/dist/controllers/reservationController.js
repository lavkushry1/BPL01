"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTickets = exports.verifyUTR = exports.processPayment = exports.updateReservation = exports.createReservation = void 0;
const express_validator_1 = require("express-validator");
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
const payment_service_1 = require("../services/payment.service");
const reservation_service_1 = require("../services/reservation.service");
const apiError_1 = require("../utils/apiError");
// Payment gateway interface (Mock for now, but integrated into flow)
class PaymentGateway {
    static async verifyUTRPayment(utrNumber) {
        // In a real app, this would call a banking API
        // For now, we validate the format (12 digits)
        return /^\d{12}$/.test(utrNumber);
    }
}
const createReservation = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { eventId, tickets, totalAmount } = req.body;
        // @ts-ignore - User is attached by auth middleware
        const userId = req.user.id;
        const booking = await reservation_service_1.reservationService.createReservation({
            userId,
            eventId,
            tickets,
            totalAmount // Optional, service will calculate if missing
        });
        res.status(201).json({
            success: true,
            reservationId: booking.id,
            paymentDeadline: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        });
    }
    catch (error) {
        console.error('Reservation error:', error);
        const status = error instanceof apiError_1.ApiError ? error.statusCode : 500;
        const message = error instanceof apiError_1.ApiError ? error.message : 'Failed to create reservation';
        res.status(status).json({ error: message });
    }
};
exports.createReservation = createReservation;
const updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        // Validate status enum if needed, but service/prisma will throw if invalid
        const booking = await reservation_service_1.reservationService.updateReservation(id, { status });
        res.json({
            success: true,
            message: 'Reservation updated successfully',
            reservation: booking
        });
    }
    catch (error) {
        console.error('Update reservation error:', error);
        res.status(500).json({
            error: 'Failed to update reservation',
            details: error.message
        });
    }
};
exports.updateReservation = updateReservation;
const processPayment = async (req, res) => {
    // Payment processing logic placeholder
    res.status(501).json({ message: 'Not implemented' });
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
        // Fetch the booking to get the amount
        const booking = await reservation_service_1.reservationService.getReservationById(reservationId);
        if (!booking) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        // Verify payment with "Banking API"
        const paymentVerified = await PaymentGateway.verifyUTRPayment(utrNumber);
        if (!paymentVerified) {
            return res.status(402).json({ error: 'Payment verification failed' });
        }
        // Record the UTR submission
        await payment_service_1.paymentService.createUTRPayment({
            booking_id: reservationId,
            amount: booking.finalAmount.toNumber(),
            utr_number: utrNumber,
            status: 'pending' // Pending admin approval
        });
        res.json({
            success: true,
            message: 'Payment submitted for verification',
            verifiedAt: new Date().toISOString(),
            nextSteps: ['wait_for_admin_verification']
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
        // Fetch actual reservation data
        const booking = await reservation_service_1.reservationService.getReservationById(reservationId);
        if (!booking) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        if (booking.status !== 'CONFIRMED') {
            return res.status(400).json({ error: 'Booking is not confirmed' });
        }
        // Prepare data for PDF
        const reservationData = {
            eventId: booking.eventId,
            eventTitle: booking.event?.title || 'Event',
            tickets: booking.seats,
            totalAmount: Number(booking.finalAmount),
            userEmail: booking.user?.email || 'user@example.com'
        };
        // Generate PDF ticket
        const pdfBuffer = await generateTicketPDF(reservationData);
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
            if (reservation.tickets) {
                Object.entries(reservation.tickets).forEach(([category, quantity]) => {
                    for (let i = 0; i < quantity; i++) {
                        doc.fontSize(18).text(`Event: ${reservation.eventTitle}`);
                        doc.fontSize(12).text(`Category: ${category}`);
                        doc.text(`Ticket ${i + 1} of ${quantity}`);
                        doc.image(qrImage, { width: 100 });
                        doc.moveDown(2);
                    }
                });
            }
            else {
                doc.text('No seat details available');
            }
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
};
//# sourceMappingURL=reservationController.js.map