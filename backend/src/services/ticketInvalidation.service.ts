import crypto from 'crypto';
import prisma from '../db/prisma';
import { ApiError } from '../utils/apiError';

/**
 * Ticket Invalidation Service
 *
 * This service handles ticket validation and prevents duplicate ticket use
 * by maintaining a secure record of scanned tickets.
 */
export class TicketInvalidationService {
  /**
   * Validate a ticket and mark it as used if valid
   * @param ticketId Ticket ID
   * @param eventId Event ID
   * @param checkpointId Checkpoint/gate ID where the ticket is being scanned
   * @param scannerUserId ID of the user scanning the ticket
   */
  static async validateAndInvalidateTicket(
    ticketId: string,
    eventId: string,
    checkpointId: string,
    scannerUserId: string
  ): Promise<{
    valid: boolean;
    ticket?: any;
    error?: string;
    scannedAt?: Date;
    entryCount?: number;
  }> {
    try {
      // Get ticket details
      const getTicket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          booking: true,
          ticketCategory: true,
          ticketScans: true
        } as any
      });
      const ticket = getTicket as any;

      // Check if ticket exists
      if (!ticket) {
        await this.logInvalidScan(ticketId, eventId, checkpointId, scannerUserId, 'TICKET_NOT_FOUND');
        return {
          valid: false,
          error: 'Ticket not found'
        };
      }

      // Check if ticket is for this event
      if (ticket.booking.eventId !== eventId) {
        await this.logInvalidScan(ticketId, eventId, checkpointId, scannerUserId, 'WRONG_EVENT');
        return {
          valid: false,
          error: 'Ticket is for a different event',
          ticket
        };
      }

      // Check if ticket is valid (not cancelled, etc.)
      if (ticket.status !== 'ACTIVE') {
        await this.logInvalidScan(ticketId, eventId, checkpointId, scannerUserId, 'INVALID_STATUS');
        return {
          valid: false,
          error: `Ticket is ${ticket.status.toLowerCase()}`,
          ticket
        };
      }

      // Check if ticket has already been scanned (potential duplicate)
      const existingScans = ticket.ticketScans || [];
      const entryCount = existingScans.length;

      // If multi-entry is allowed for this ticket type, we might allow multiple scans
      const ticketType = ticket.ticketCategory?.type || '';
      const isMultiEntryAllowed = ticketType.includes('MULTI_ENTRY');

      if (entryCount > 0 && !isMultiEntryAllowed) {
        // Get the last scan timestamp to report when it was previously scanned
        const lastScan = existingScans.sort((a: any, b: any) =>
          new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
        )[0];

        await this.logInvalidScan(ticketId, eventId, checkpointId, scannerUserId, 'ALREADY_SCANNED');

        return {
          valid: false,
          error: 'Ticket already scanned',
          ticket,
          scannedAt: lastScan.scannedAt,
          entryCount
        };
      }

      // All checks passed, record the entry
      const now = new Date();
      const scanId = crypto.randomUUID();

      // Record the scan
      await (prisma as any).ticketScan.create({
        data: {
          id: scanId,
          ticketId,
          location: checkpointId,
          scannedBy: scannerUserId,
          scannedAt: now,
          isValid: true,
          notes: `Entry #${entryCount + 1}`
        }
      });

      // Update the ticket's last scan timestamp
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          lastScannedAt: now
        } as any
      });

      return {
        valid: true,
        ticket,
        scannedAt: now,
        entryCount: entryCount + 1
      };
    } catch (error) {
      console.error('Error validating ticket:', error);
      await this.logInvalidScan(ticketId, eventId, checkpointId, scannerUserId, 'SYSTEM_ERROR');
      throw new ApiError(500, 'Error validating ticket', 'VALIDATION_ERROR');
    }
  }

  /**
   * Log an invalid ticket scan attempt
   */
  private static async logInvalidScan(
    ticketId: string,
    _eventId: string,
    checkpointId: string,
    scannerUserId: string,
    reason: string
  ): Promise<void> {
    try {
      await (prisma as any).ticketScan.create({
        data: {
          id: crypto.randomUUID(),
          ticketId,
          location: checkpointId,
          scannedBy: scannerUserId,
          scannedAt: new Date(),
          isValid: false,
          notes: `Invalid: ${reason}`
        }
      });
    } catch (error) {
      console.error('Error logging invalid scan:', error);
    }
  }

  /**
   * Get scan history for a ticket
   * @param ticketId Ticket ID
   */
  static async getTicketScanHistory(
    ticketId: string
  ): Promise<any[]> {
    try {
      const scans = await (prisma as any).ticketScan.findMany({
        where: { ticketId },
        orderBy: { scannedAt: 'desc' },
        include: {
          ticket: true
        }
      });

      return scans;
    } catch (error) {
      console.error('Error fetching ticket scan history:', error);
      throw new ApiError(500, 'Error fetching ticket scan history', 'DATABASE_ERROR');
    }
  }

  /**
   * Manually override a ticket's validation status
   * @param ticketId Ticket ID
   * @param adminUserId ID of admin user making the change
   * @param newStatus New status for the ticket
   * @param reason Reason for the override
   */
  static async overrideTicketStatus(
    ticketId: string,
    adminUserId: string,
    newStatus: string,
    reason: string
  ): Promise<any> {
    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new ApiError(404, 'Ticket not found', 'TICKET_NOT_FOUND');
    }

    // Update the ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus as any }
    });

    // Log the status override
    await (prisma as any).ticketStatusLog.create({
      data: {
        ticketId,
        fromStatus: ticket.status,
        toStatus: newStatus,
        changedBy: adminUserId,
        reason,
        createdAt: new Date()
      }
    });

    return updatedTicket;
  }

  /**
   * Generate ticket validation statistics for an event
   * @param eventId Event ID
   */
  static async getEventScanStatistics(
    eventId: string
  ): Promise<{
    totalTickets: number;
    scannedTickets: number;
    validScans: number;
    invalidScans: number;
    duplicateAttempts: number;
    checkpointStats: any[];
  }> {
    // Get all tickets for the event
    const eventBookings = await prisma.booking.findMany({
      where: { eventId, status: 'CONFIRMED' },
      include: { tickets: true }
    });

    // Extract all ticket IDs for the event
    const ticketIds = eventBookings.flatMap(booking =>
      booking.tickets.map(ticket => ticket.id)
    );

    // Get scan data
    const scans = await (prisma as any).ticketScan.findMany({
      where: { eventId }
    });

    // Count unique scanned tickets
    const scannedTicketIds = [...new Set(scans.map((scan: any) => scan.ticketId))];

    // Group by checkpoint
    const checkpointMap = new Map();
    scans.forEach((scan: any) => {
      if (!checkpointMap.has(scan.checkpointId)) {
        checkpointMap.set(scan.checkpointId, {
          checkpointId: scan.checkpointId,
          totalScans: 0,
          validScans: 0,
          invalidScans: 0
        });
      }

      const stats = checkpointMap.get(scan.checkpointId);
      stats.totalScans++;

      if (scan.status === 'VALID') {
        stats.validScans++;
      } else {
        stats.invalidScans++;
      }
    });

    return {
      totalTickets: ticketIds.length,
      scannedTickets: scannedTicketIds.length,
      validScans: scans.filter((scan: any) => scan.isValid).length,
      invalidScans: scans.filter((scan: any) => !scan.isValid).length,
      duplicateAttempts: 0,
      checkpointStats: []
    };
  }
}
