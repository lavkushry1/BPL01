import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { WebsocketService } from './websocket.service';

/**
 * Ticket service for generating tickets, QR codes and PDFs
 */
export class TicketService {
  /**
   * Generate tickets for a booking
   * @param bookingId Booking ID
   * @returns Array of generated ticket IDs
   */
  static async generateTickets(bookingId: string): Promise<string[]> {
    try {
      // Get booking details
      const booking = await db('bookings')
        .where('id', bookingId)
        .first();
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Get event details
      const event = await db('events')
        .where('id', booking.event_id)
        .first();

      if (!event) {
        throw new Error('Event not found');
      }

      // Check if booking has seat IDs or just ticket quantities
      const ticketIds: string[] = [];
      
      if (booking.seat_ids && booking.seat_ids.length > 0) {
        // For seated events, create ticket per seat
        for (const seatId of booking.seat_ids) {
          const seat = await db('seats')
            .where('id', seatId)
            .first();
          
          if (!seat) {
            continue;
          }

          const ticketId = await this.createTicket({
            bookingId,
            eventId: booking.event_id,
            userId: booking.user_id,
            seatId,
            seatInfo: `${seat.section} ${seat.row}${seat.number}`,
            price: seat.price,
            ticketType: 'seated'
          });
          
          ticketIds.push(ticketId);
        }
      } else if (booking.ticket_types) {
        // For non-seated events, create tickets based on quantities
        for (const ticketType of booking.ticket_types) {
          for (let i = 0; i < ticketType.quantity; i++) {
            const ticketId = await this.createTicket({
              bookingId,
              eventId: booking.event_id,
              userId: booking.user_id,
              price: ticketType.price,
              ticketType: ticketType.id
            });
            
            ticketIds.push(ticketId);
          }
        }
      }

      // Update booking status if needed
      if (booking.status === 'pending' && ticketIds.length > 0) {
        await db('bookings')
          .where('id', bookingId)
          .update({
            status: 'confirmed',
            updated_at: new Date()
          });
      }

      // Notify via WebSocket
      WebsocketService.notifyTicketsGenerated(
        bookingId,
        booking.user_id,
        ticketIds.length
      );

      return ticketIds;
    } catch (error) {
      console.error('Error generating tickets:', error);
      throw error;
    }
  }

  /**
   * Create a single ticket record
   * @param params Ticket parameters
   * @returns Generated ticket ID
   */
  static async createTicket(params: {
    bookingId: string;
    eventId: string;
    userId: string;
    seatId?: string;
    seatInfo?: string;
    price: number;
    ticketType: string;
  }): Promise<string> {
    const ticketId = uuidv4();
    const ticketNumber = this.generateTicketNumber();
    
    // Generate QR code
    const qrCodeData = await this.generateQRCode({
      ticketId,
      bookingId: params.bookingId,
      eventId: params.eventId,
      ticketNumber
    });
    
    // Store QR code image
    const qrCodePath = path.join(__dirname, '../../public/qrcodes', `${ticketId}.png`);
    fs.mkdirSync(path.dirname(qrCodePath), { recursive: true });
    fs.writeFileSync(qrCodePath, qrCodeData);
    
    // Create ticket record
    await db('tickets').insert({
      id: ticketId,
      booking_id: params.bookingId,
      event_id: params.eventId,
      user_id: params.userId,
      ticket_number: ticketNumber,
      seat_id: params.seatId || null,
      seat_info: params.seatInfo || null,
      ticket_type: params.ticketType,
      price: params.price,
      status: 'active',
      qr_code_url: `/qrcodes/${ticketId}.png`,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    return ticketId;
  }

  /**
   * Generate QR code for a ticket
   * @param data Ticket data for QR code
   * @returns QR code as buffer
   */
  static async generateQRCode(data: {
    ticketId: string;
    bookingId: string;
    eventId: string;
    ticketNumber: string;
  }): Promise<Buffer> {
    // Create a QR code payload with encrypted/signed data
    const payload = JSON.stringify({
      id: data.ticketId,
      booking: data.bookingId,
      event: data.eventId,
      number: data.ticketNumber,
      ts: Date.now() // Timestamp for verification
    });
    
    // Generate QR code
    const qrBuffer = await QRCode.toBuffer(payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 8
    });
    
    return qrBuffer;
  }

  /**
   * Generate a unique ticket number
   * @returns Formatted ticket number string
   */
  static generateTicketNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EVT-${timestamp}-${random}`;
  }

  /**
   * Generate a PDF ticket
   * @param param Object containing ticketId or the ticketId directly
   * @returns Path to generated PDF file
   */
  static async generatePDF(param: any): Promise<string> {
    try {
      // Normalize the ticket ID - handle any parameter format
      let ticketId: string;
      
      if (typeof param === 'object' && param !== null) {
        if ('ticketId' in param) {
          ticketId = String(param.ticketId);
        } else if ('id' in param) {
          ticketId = String(param.id);
        } else {
          // Default to the entire object stringified
          ticketId = String(param);
        }
      } else {
        ticketId = String(param);
      }
      
      // Get ticket details
      const ticket = await db('tickets')
        .where('id', ticketId)
        .first();
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      // Get booking and event details
      const booking = await db('bookings')
        .where('id', ticket.booking_id)
        .first();
      
      const event = await db('events')
        .where('id', ticket.event_id)
        .first();
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Create PDF directory if it doesn't exist
      const pdfDir = path.join(__dirname, '../../public/tickets');
      fs.mkdirSync(pdfDir, { recursive: true });
      
      // PDF filename
      const pdfFilename = `ticket_${ticket.id}.pdf`;
      const pdfPath = path.join(pdfDir, pdfFilename);
      
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      
      // Pipe output to file
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);
      
      // Add ticket content
      doc.fontSize(20).text('EVENT TICKET', { align: 'center' });
      doc.moveDown();
      
      // Event details
      doc.fontSize(16).text(event.title, { align: 'center' });
      doc.fontSize(12).text(`Date: ${new Date(event.start_date).toLocaleDateString()}`, { align: 'center' });
      doc.fontSize(12).text(`Time: ${new Date(event.start_date).toLocaleTimeString()}`, { align: 'center' });
      doc.moveDown();
      
      // Ticket details
      doc.fontSize(14).text('Ticket Information');
      doc.fontSize(12).text(`Ticket #: ${ticket.ticket_number}`);
      
      if (ticket.seat_info) {
        doc.fontSize(12).text(`Seat: ${ticket.seat_info}`);
      }
      
      doc.fontSize(12).text(`Type: ${ticket.ticket_type}`);
      doc.fontSize(12).text(`Price: ${ticket.price.toFixed(2)}`);
      doc.moveDown();
      
      // Add QR code
      const qrPath = path.join(__dirname, '../../public', ticket.qr_code_url);
      if (fs.existsSync(qrPath)) {
        doc.image(qrPath, {
          fit: [250, 250],
          align: 'center'
        });
      }
      
      // Add terms and conditions
      doc.moveDown();
      doc.fontSize(10).text('Terms and Conditions:', { underline: true });
      doc.fontSize(8).text('1. This ticket must be presented at the venue for entry.');
      doc.fontSize(8).text('2. Please arrive at least 30 minutes before the event start time.');
      doc.fontSize(8).text('3. This ticket is non-refundable and non-transferable.');
      
      // Finalize PDF
      doc.end();
      
      // Wait for the stream to finish
      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve(`/tickets/${pdfFilename}`);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Error generating PDF ticket:', error);
      throw error;
    }
  }

  /**
   * Verify a ticket's validity
   * @param ticketId Ticket ID
   * @param eventId Event ID
   * @returns Verification result
   */
  static async verifyTicket(ticketId: string, eventId: string): Promise<{
    valid: boolean;
    message: string;
    ticket?: any;
  }> {
    try {
      // Get ticket details
      const ticket = await db('tickets')
        .where('id', ticketId)
        .where('event_id', eventId)
        .first();
      
      if (!ticket) {
        return {
          valid: false,
          message: 'Ticket not found for this event'
        };
      }
      
      // Check ticket status
      if (ticket.status === 'used') {
        return {
          valid: false,
          message: 'Ticket has already been used',
          ticket
        };
      }
      
      if (ticket.status === 'cancelled') {
        return {
          valid: false,
          message: 'Ticket has been cancelled',
          ticket
        };
      }
      
      // Check event date
      const event = await db('events')
        .where('id', eventId)
        .first();
      
      if (!event) {
        return {
          valid: false,
          message: 'Event not found'
        };
      }
      
      const eventDate = new Date(event.start_date);
      const now = new Date();
      
      if (eventDate < new Date(now.setDate(now.getDate() - 1))) {
        return {
          valid: false,
          message: 'Event has already passed',
          ticket
        };
      }
      
      return {
        valid: true,
        message: 'Ticket is valid',
        ticket
      };
    } catch (error) {
      console.error('Error verifying ticket:', error);
      throw error;
    }
  }

  /**
   * Check in a ticket at the event
   * @param ticketId Ticket ID
   * @param eventId Event ID
   * @param location Optional check-in location
   * @returns Check-in result
   */
  static async checkInTicket(
    ticketId: string,
    eventId: string,
    location?: string
  ): Promise<{ success: boolean; message: string; ticket?: any }> {
    try {
      // Verify ticket first
      const verification = await this.verifyTicket(ticketId, eventId);
      
      if (!verification.valid) {
        return {
          success: false,
          message: verification.message,
          ticket: verification.ticket
        };
      }
      
      // Mark ticket as used
      await db('tickets')
        .where('id', ticketId)
        .update({
          status: 'used',
          check_in_time: new Date(),
          check_in_location: location || null,
          updated_at: new Date()
        });
      
      // Get updated ticket
      const updatedTicket = await db('tickets')
        .where('id', ticketId)
        .first();
      
      return {
        success: true,
        message: 'Ticket checked in successfully',
        ticket: updatedTicket
      };
    } catch (error) {
      console.error('Error checking in ticket:', error);
      throw error;
    }
  }

  /**
   * Generate tickets for a booking after payment verification
   * @param bookingId Booking ID 
   * @param adminId Admin ID who verified the payment
   * @returns Array of generated ticket IDs
   */
  static async generateTicketsForBooking(
    bookingId: string,
    adminId: string
  ): Promise<string[]> {
    try {
      // Check if booking exists and is in confirmed status
      const booking = await db('bookings')
        .where('id', bookingId)
        .first();
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      if (booking.status !== 'confirmed') {
        throw new Error(`Cannot generate tickets for booking in ${booking.status} state`);
      }
      
      // Check if tickets already exist for this booking
      const existingTickets = await db('tickets')
        .where('booking_id', bookingId)
        .select('id');
      
      if (existingTickets.length > 0) {
        // Tickets already generated, return their IDs
        return existingTickets.map(ticket => ticket.id);
      }
      
      // Generate tickets
      const ticketIds = await this.generateTickets(bookingId);
      
      if (ticketIds.length === 0) {
        throw new Error('No tickets generated');
      }
      
      // Generate PDFs asynchronously
      this.generatePDFsAsync(ticketIds);
      
      // Remove from generation queue if present
      await db('ticket_generation_queue')
        .where('booking_id', bookingId)
        .delete();
      
      // Send notification to admin
      try {
        WebsocketService.sendToUser(adminId, 'tickets_generated', {
          booking_id: bookingId,
          ticket_count: ticketIds.length,
          message: `Successfully generated ${ticketIds.length} tickets for booking ${bookingId}`
        });
      } catch (error) {
        console.warn('Failed to send admin notification:', error);
      }
      
      return ticketIds;
    } catch (error) {
      console.error('Error generating tickets for booking:', error);
      
      // Update retry queue with error information
      try {
        await db('ticket_generation_queue')
          .where('booking_id', bookingId)
          .increment('attempts', 1)
          .update({
            last_attempt_at: new Date(),
            last_error: error instanceof Error ? error.message : 'Unknown error',
            next_attempt_at: new Date(Date.now() + 5 * 60 * 1000) // Retry in 5 minutes
          });
      } catch (queueError) {
        console.error('Error updating ticket generation queue:', queueError);
      }
      
      throw error;
    }
  }
  
  /**
   * Generate PDFs for multiple tickets asynchronously
   * @param ticketIds Array of ticket IDs
   */
  static async generatePDFsAsync(ticketIds: string[]): Promise<void> {
    // Process in background without awaiting
    (async () => {
      for (const ticketId of ticketIds) {
        try {
          await this.generatePDF(ticketId);
        } catch (error) {
          console.error(`Error generating PDF for ticket ${ticketId}:`, error);
        }
      }
    })();
  }
  
  /**
   * Process ticket generation queue
   * This should be called by a cron job
   */
  static async processTicketGenerationQueue(): Promise<{
    processed: number,
    success: number,
    failed: number
  }> {
    try {
      const now = new Date();
      
      // Find tickets due for processing
      const queueItems = await db('ticket_generation_queue')
        .where('next_attempt_at', '<', now)
        .whereRaw('attempts < max_attempts')
        .select('*');
      
      if (queueItems.length === 0) {
        return { processed: 0, success: 0, failed: 0 };
      }
      
      let success = 0;
      let failed = 0;
      
      // Process each queued item
      for (const item of queueItems) {
        try {
          await this.generateTicketsForBooking(item.booking_id, item.admin_id);
          success++;
        } catch (error) {
          console.error(`Failed to generate tickets for booking ${item.booking_id}:`, error);
          failed++;
          
          // If max attempts reached, mark as failed and notify admin
          if (item.attempts >= item.maxAttempts - 1) {
            try {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error - max retries reached';
              await db('ticket_generation_queue')
                .where({ id: item.id })
                .update({
                  status: 'failed',
                  processed_at: db.fn.now(),
                  attempts: item.attempts + 1,
                  last_error: errorMessage,
                  updated_at: db.fn.now()
                });
              
              // Send notification to admin about failed generation
              WebsocketService.sendToUser(item.admin_id, 'tickets_generation_failed', {
                booking_id: item.booking_id,
                message: `Failed to generate tickets after ${item.maxAttempts} attempts. Manual intervention required.`
              });
            } catch (notifyError) {
              console.error('Error notifying admin of failed ticket generation:', notifyError);
            }
          }
        }
      }
      
      return {
        processed: queueItems.length,
        success,
        failed
      };
    } catch (error) {
      console.error('Error processing ticket generation queue:', error);
      return { processed: 0, success: 0, failed: 0 };
    }
  }
}

export default TicketService;