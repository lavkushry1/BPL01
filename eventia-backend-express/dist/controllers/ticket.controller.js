"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const ticket_service_1 = require("../services/ticket.service");
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * @class TicketController
 * @description Controller for ticket-related operations
 */
class TicketController {
    /**
     * Generate tickets for a booking
     * @route POST /api/tickets/generate
     */
    static async generateTickets(req, res, next) {
        try {
            const { booking_id } = req.body;
            // Use static method from TicketService
            const ticketIds = await ticket_service_1.TicketService.generateTickets(booking_id);
            if (ticketIds.length === 0) {
                throw new apiError_1.ApiError(400, 'Failed to generate tickets');
            }
            // Fetch ticket details
            const tickets = await Promise.all(ticketIds.map(async (id) => {
                return (await req.db('tickets').where('id', id).first());
            }));
            apiResponse_1.ApiResponse.success(res, 201, 'Tickets generated successfully', {
                tickets,
                count: tickets.length
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get ticket by ID
     * @route GET /api/tickets/:id
     */
    static async getTicketById(req, res, next) {
        try {
            const { id } = req.params;
            const ticket = await req.db('tickets').where('id', id).first();
            if (!ticket) {
                throw new apiError_1.ApiError(404, 'Ticket not found');
            }
            apiResponse_1.ApiResponse.success(res, 200, 'Ticket retrieved successfully', ticket);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get tickets for a booking
     * @route GET /api/bookings/:bookingId/tickets
     */
    static async getTicketsByBookingId(req, res, next) {
        try {
            const { booking_id } = req.params;
            const tickets = await req.db('tickets').where('booking_id', booking_id);
            apiResponse_1.ApiResponse.success(res, 200, 'Tickets retrieved successfully', {
                tickets,
                count: tickets.length
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Cancel a ticket
     * @route PATCH /api/tickets/:id/cancel
     */
    static async cancelTicket(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const ticket = await req.db('tickets').where('id', id).first();
            if (!ticket) {
                throw new apiError_1.ApiError(404, 'Ticket not found');
            }
            if (ticket.status === 'cancelled') {
                throw new apiError_1.ApiError(400, 'Ticket is already cancelled');
            }
            if (ticket.status === 'used') {
                throw new apiError_1.ApiError(400, 'Cannot cancel a used ticket');
            }
            // Update ticket status
            await req.db('tickets')
                .where('id', id)
                .update({
                status: 'cancelled',
                cancellation_reason: reason || 'Cancelled by user',
                updated_at: new Date()
            });
            // Get updated ticket
            const updatedTicket = await req.db('tickets').where('id', id).first();
            apiResponse_1.ApiResponse.success(res, 200, 'Ticket cancelled successfully', updatedTicket);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Check in a ticket at event
     * @route POST /api/tickets/check-in
     */
    static async checkInTicket(req, res, next) {
        try {
            const { ticket_id, event_id, check_in_location } = req.body;
            const result = await ticket_service_1.TicketService.checkInTicket(ticket_id, event_id, check_in_location);
            if (result.success) {
                apiResponse_1.ApiResponse.success(res, 200, result.message, result.ticket);
            }
            else {
                throw new apiError_1.ApiError(400, result.message);
            }
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Verify a ticket's validity
     * @route GET /api/tickets/:id/verify
     */
    static async verifyTicket(req, res, next) {
        try {
            const { id } = req.params;
            const { event_id } = req.body;
            if (!event_id) {
                throw new apiError_1.ApiError(400, 'Event ID is required');
            }
            const result = await ticket_service_1.TicketService.verifyTicket(id, event_id);
            apiResponse_1.ApiResponse.success(res, 200, result.message, {
                valid: result.valid,
                ticket: result.ticket
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Resend ticket to user's email
     * @route POST /api/tickets/:id/resend
     */
    static async resendTicket(req, res, next) {
        try {
            const { id } = req.params;
            const { email } = req.body;
            const ticket = await req.db('tickets').where('id', id).first();
            if (!ticket) {
                throw new apiError_1.ApiError(404, 'Ticket not found');
            }
            // In a real implementation, you would generate and send the ticket email here
            // For now, we'll just acknowledge the request
            apiResponse_1.ApiResponse.success(res, 200, 'Ticket resent successfully', {
                sent: true,
                email: email || 'default@email.com'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Helper to generate a PDF with proper type handling
     * @param ticketId Ticket ID
     * @returns Promise with PDF path
     */
    static async generateTicketPDF(ticketId) {
        try {
            // Use TicketService to generate PDF
            return await ticket_service_1.TicketService.generatePDF(ticketId);
        }
        catch (error) {
            console.error('Error generating ticket PDF:', error);
            throw error;
        }
    }
    /**
     * Download ticket as PDF
     * @route GET /api/tickets/:id/pdf
     */
    static async downloadTicketPdf(req, res, next) {
        try {
            const { id } = req.params;
            const ticket = await req.db('tickets').where('id', id).first();
            if (!ticket) {
                throw new apiError_1.ApiError(404, 'Ticket not found');
            }
            // Generate PDF if it doesn't exist already
            const pdfPath = await TicketController.generateTicketPDF(id);
            const fullPath = path_1.default.join(__dirname, '../../public', pdfPath);
            if (!fs_1.default.existsSync(fullPath)) {
                throw new apiError_1.ApiError(500, 'Failed to generate ticket PDF');
            }
            // Set headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=ticket_${ticket.ticket_number}.pdf`);
            // Send the file
            res.sendFile(fullPath);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get tickets for an event (admin only)
     * @route GET /api/events/:eventId/tickets
     */
    static async getEventTickets(req, res, next) {
        try {
            const { event_id } = req.params;
            const { status, page = 1, limit = 50 } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const query = req.db('tickets').where('event_id', event_id);
            if (status && typeof status === 'string') {
                query.where('status', status);
            }
            // Get total count
            const countQuery = req.db('tickets').where('event_id', event_id);
            if (status && typeof status === 'string') {
                countQuery.where('status', status);
            }
            const totalCount = await countQuery.count('id as count').first();
            // Apply pagination
            const tickets = await query
                .orderBy('created_at', 'desc')
                .offset((pageNum - 1) * limitNum)
                .limit(limitNum);
            apiResponse_1.ApiResponse.success(res, 200, 'Event tickets retrieved successfully', {
                tickets,
                pagination: {
                    total: totalCount ? Number(totalCount.count) : 0,
                    page: pageNum,
                    limit: limitNum
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get user's tickets
     * @route GET /api/users/:userId/tickets
     */
    static async getUserTickets(req, res, next) {
        try {
            const { userId } = req.params;
            const { status, page = 1, limit = 10 } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            // Check if user is requesting their own tickets or is admin
            if (req.user && req.user.id !== userId && req.user.role !== 'ADMIN') {
                throw new apiError_1.ApiError(403, 'You can only access your own tickets');
            }
            const query = req.db('tickets').where('user_id', userId);
            if (status && typeof status === 'string') {
                query.where('status', status);
            }
            // Get total count
            const countQuery = req.db('tickets').where('user_id', userId);
            if (status && typeof status === 'string') {
                countQuery.where('status', status);
            }
            const totalCount = await countQuery.count('id as count').first();
            // Apply pagination
            const tickets = await query
                .orderBy('created_at', 'desc')
                .offset((pageNum - 1) * limitNum)
                .limit(limitNum);
            apiResponse_1.ApiResponse.success(res, 200, 'User tickets retrieved successfully', {
                tickets,
                pagination: {
                    total: totalCount ? Number(totalCount.count) : 0,
                    page: pageNum,
                    limit: limitNum
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TicketController = TicketController;
exports.default = TicketController;
