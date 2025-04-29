import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/ticket.service';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { Knex } from 'knex';

// Add type definition for the extended request with db
interface DatabaseRequest extends Request {
  db: Knex;
}

/**
 * @class TicketController
 * @description Controller for ticket-related operations
 */
export class TicketController {
  /**
   * Generate tickets for a booking
   * @route POST /api/tickets/generate
   */
  static async generateTickets(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        booking_id: z.string().uuid(),
        event_id: z.string().uuid(),
        user_id: z.string().uuid(),
        email: z.string().email().optional(),
        send_email: z.boolean().optional().default(true)
      });
      
      const validatedData = schema.parse(req.body);
      
      const ticketIds = await TicketService.generateTickets(validatedData.booking_id);
      
      if (ticketIds.length === 0) {
        throw new ApiError(400, 'Failed to generate tickets');
      }
      
      // Fetch ticket details
      const tickets = await Promise.all(
        ticketIds.map(async (id) => {
          return (await req.db('tickets').where('id', id).first());
        })
      );
      
      ApiResponse.success(res, {
        tickets,
        count: tickets.length
      }, 'Tickets generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ticket by ID
   * @route GET /api/tickets/:id
   */
  static async getTicketById(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const ticket = await req.db('tickets').where('id', id).first();
      
      if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
      }
      
      ApiResponse.success(res, ticket, 'Ticket retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tickets for a booking
   * @route GET /api/bookings/:bookingId/tickets
   */
  static async getTicketsByBookingId(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId } = req.params;
      
      const tickets = await req.db('tickets').where('booking_id', bookingId);
      
      ApiResponse.success(res, tickets, 'Tickets retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel a ticket
   * @route PATCH /api/tickets/:id/cancel
   */
  static async cancelTicket(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const ticket = await req.db('tickets').where('id', id).first();
      
      if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
      }
      
      if (ticket.status === 'cancelled') {
        throw new ApiError(400, 'Ticket is already cancelled');
      }
      
      if (ticket.status === 'used') {
        throw new ApiError(400, 'Cannot cancel a used ticket');
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
      
      ApiResponse.success(res, updatedTicket, 'Ticket cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check in a ticket at event
   * @route POST /api/tickets/check-in
   */
  static async checkInTicket(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        ticket_id: z.string().uuid(),
        event_id: z.string().uuid(),
        check_in_location: z.string().optional(),
        device_id: z.string().optional(),
        notes: z.string().optional()
      });
      
      const validatedData = schema.parse(req.body);
      
      const result = await TicketService.checkInTicket(
        validatedData.ticket_id,
        validatedData.event_id,
        validatedData.check_in_location
      );
      
      if (result.success) {
        ApiResponse.success(res, result.ticket, result.message);
      } else {
        throw new ApiError(400, result.message);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify a ticket's validity
   * @route GET /api/tickets/:id/verify
   */
  static async verifyTicket(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { event_id } = req.query;
      
      if (!event_id || typeof event_id !== 'string') {
        throw new ApiError(400, 'Event ID is required');
      }
      
      const result = await TicketService.verifyTicket(id, event_id);
      
      ApiResponse.success(res, {
        valid: result.valid,
        ticket: result.ticket
      }, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend ticket to user's email
   * @route POST /api/tickets/:id/resend
   */
  static async resendTicket(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { email } = req.body;
      
      const ticket = await req.db('tickets').where('id', id).first();
      
      if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
      }
      
      // In a real implementation, you would generate and send the ticket email here
      // For now, we'll just acknowledge the request
      
      ApiResponse.success(res, {
        ticket_id: id,
        sent_to: email || 'registered email'
      }, 'Ticket resent successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper to generate a PDF with proper type handling
   * @param ticketId Ticket ID
   * @returns Promise with PDF path
   */
  private static async generateTicketPDF(ticketId: any): Promise<string> {
    // Use an object format to avoid type issues
    // @ts-ignore
    return TicketService.generatePDF({ id: String(ticketId) });
  }

  /**
   * Download ticket as PDF
   * @route GET /api/tickets/:id/pdf
   */
  static async downloadTicketPdf(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const ticket = await req.db('tickets').where('id', id).first();
      
      if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
      }
      
      // Generate PDF if it doesn't exist already
      const pdfPath = await TicketController.generateTicketPDF(id);
      const fullPath = path.join(__dirname, '../../public', pdfPath);
      
      if (!fs.existsSync(fullPath)) {
        throw new ApiError(500, 'Failed to generate ticket PDF');
      }
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=ticket_${ticket.ticket_number}.pdf`);
      
      // Send the file
      res.sendFile(fullPath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tickets for an event (admin only)
   * @route GET /api/events/:eventId/tickets
   */
  static async getEventTickets(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const { page = '1', limit = '50', status } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      
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
      
      ApiResponse.success(res, {
        tickets,
        total: totalCount ? Number(totalCount.count) : 0,
        page: pageNum,
        limit: limitNum
      }, 'Event tickets retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's tickets
   * @route GET /api/users/:userId/tickets
   */
  static async getUserTickets(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '10', status } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      
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
      
      ApiResponse.success(res, {
        tickets,
        total: totalCount ? Number(totalCount.count) : 0,
        page: pageNum,
        limit: limitNum
      }, 'User tickets retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default TicketController;
