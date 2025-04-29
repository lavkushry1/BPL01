"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const ticket_service_1 = require("../services/ticket.service");
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const zod_1 = require("zod");
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
            const schema = zod_1.z.object({
                booking_id: zod_1.z.string().uuid(),
                event_id: zod_1.z.string().uuid(),
                user_id: zod_1.z.string().uuid(),
                email: zod_1.z.string().email().optional(),
                send_email: zod_1.z.boolean().optional().default(true)
            });
            const validatedData = schema.parse(req.body);
            const ticketIds = await ticket_service_1.TicketService.generateTickets(validatedData.booking_id);
            if (ticketIds.length === 0) {
                throw new apiError_1.ApiError(400, 'Failed to generate tickets');
            }
            // Fetch ticket details
            const tickets = await Promise.all(ticketIds.map(async (id) => {
                return (await req.db('tickets').where('id', id).first());
            }));
            apiResponse_1.ApiResponse.success(res, {
                tickets,
                count: tickets.length
            }, 'Tickets generated successfully', 201);
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
            apiResponse_1.ApiResponse.success(res, ticket, 'Ticket retrieved successfully');
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
            const { bookingId } = req.params;
            const tickets = await req.db('tickets').where('booking_id', bookingId);
            apiResponse_1.ApiResponse.success(res, tickets, 'Tickets retrieved successfully');
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
            apiResponse_1.ApiResponse.success(res, updatedTicket, 'Ticket cancelled successfully');
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
            const schema = zod_1.z.object({
                ticket_id: zod_1.z.string().uuid(),
                event_id: zod_1.z.string().uuid(),
                check_in_location: zod_1.z.string().optional(),
                device_id: zod_1.z.string().optional(),
                notes: zod_1.z.string().optional()
            });
            const validatedData = schema.parse(req.body);
            const result = await ticket_service_1.TicketService.checkInTicket(validatedData.ticket_id, validatedData.event_id, validatedData.check_in_location);
            if (result.success) {
                apiResponse_1.ApiResponse.success(res, result.ticket, result.message);
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
            const { event_id } = req.query;
            if (!event_id || typeof event_id !== 'string') {
                throw new apiError_1.ApiError(400, 'Event ID is required');
            }
            const result = await ticket_service_1.TicketService.verifyTicket(id, event_id);
            apiResponse_1.ApiResponse.success(res, {
                valid: result.valid,
                ticket: result.ticket
            }, result.message);
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
            apiResponse_1.ApiResponse.success(res, {
                ticket_id: id,
                sent_to: email || 'registered email'
            }, 'Ticket resent successfully');
        }
        catch (error) {
            next(error);
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
            const pdfPath = await ticket_service_1.TicketService.generatePDF(id);
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
            const { eventId } = req.params;
            const { page = '1', limit = '50', status } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const query = req.db('tickets').where('event_id', eventId);
            if (status && typeof status === 'string') {
                query.where('status', status);
            }
            // Get total count
            const countQuery = req.db('tickets').where('event_id', eventId);
            if (status && typeof status === 'string') {
                countQuery.where('status', status);
            }
            const totalCount = await countQuery.count('id as count').first();
            // Apply pagination
            const tickets = await query
                .orderBy('created_at', 'desc')
                .offset((pageNum - 1) * limitNum)
                .limit(limitNum);
            apiResponse_1.ApiResponse.success(res, {
                tickets,
                total: totalCount ? Number(totalCount.count) : 0,
                page: pageNum,
                limit: limitNum
            }, 'Event tickets retrieved successfully');
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
            const { page = '1', limit = '10', status } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
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
            apiResponse_1.ApiResponse.success(res, {
                tickets,
                total: totalCount ? Number(totalCount.count) : 0,
                page: pageNum,
                limit: limitNum
            }, 'User tickets retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TicketController = TicketController;
exports.default = TicketController;
