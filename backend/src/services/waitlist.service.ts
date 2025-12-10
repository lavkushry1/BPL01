import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Configure email transporter (mock for dev)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass'
  }
});

export class WaitlistService {
  /**
   * Join waitlist for a specific match section
   */
  static async joinWaitlist(
    email: string,
    matchId: string,
    sectionId: string,
    userId?: string
  ) {
    // Check if already in waitlist
    const existingEntry = await prisma.waitlistEntry.findFirst({
      where: {
        email,
        iplMatchId: matchId,
        sectionId,
        status: 'PENDING'
      }
    });

    if (existingEntry) {
      return { success: true, message: 'Already on waitlist', entry: existingEntry };
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        email,
        iplMatchId: matchId,
        sectionId,
        userId,
        status: 'PENDING'
      }
    });

    // Send confirmation email (fire and forget)
    this.sendWaitlistConfirmation(email, matchId, sectionId).catch(console.error);

    return { success: true, message: 'Added to waitlist', entry };
  }

  /**
   * Check if user is on waitlist
   */
  static async checkStatus(email: string, matchId: string, sectionId: string) {
    const entry = await prisma.waitlistEntry.findFirst({
      where: {
        email,
        iplMatchId: matchId,
        sectionId,
        status: 'PENDING'
      }
    });

    return { isOnWaitlist: !!entry, entry };
  }

  /**
   * Notify waitlisted users when seats become available
   * Should be called when seats are released/added
   */
  static async notifyWaitlist(matchId: string, sectionId: string, availableCount: number) {
    // Get oldest pending entries (FIFO)
    const entries = await prisma.waitlistEntry.findMany({
      where: {
        iplMatchId: matchId,
        sectionId,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'asc' },
      take: availableCount * 2 // Notify more people than seats to ensure booking
    });

    if (entries.length === 0) return 0;

    const notifiedCount = 0;

    // In a real app, uses a queue. Here we just loop.
    for (const entry of entries) {
      try {
        await this.sendAvailabilityNotification(entry.email, matchId, sectionId);

        await prisma.waitlistEntry.update({
          where: { id: entry.id },
          data: { status: 'NOTIFIED' }
        });

      } catch (error) {
        console.error(`Failed to notify ${entry.email}:`, error);
      }
    }

    return entries.length;
  }

  private static async sendWaitlistConfirmation(email: string, matchId: string, sectionId: string) {
    const match = await prisma.iplMatch.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true }
    });

    if (!match) return;

    await transporter.sendMail({
      from: '"IPL Tickets" <noreply@ipltickets.com>',
      to: email,
      subject: `Waitlist Confirmation: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>You're on the list!</h2>
          <p>We've added you to the waitlist for <strong>${sectionId}</strong> seats for the match:</p>
          <h3>${match.homeTeam.name} vs ${match.awayTeam.name}</h3>
          <p>We'll notify you as soon as tickets become available.</p>
        </div>
      `
    });
  }

  private static async sendAvailabilityNotification(email: string, matchId: string, sectionId: string) {
    const match = await prisma.iplMatch.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true }
    });

    if (!match) return;

    const bookingLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/match/${matchId}?section=${sectionId}`;

    await transporter.sendMail({
      from: '"IPL Tickets" <noreply@ipltickets.com>',
      to: email,
      subject: `TICKETS AVAILABLE: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">Tickets are available!</h2>
          <p>Great news! Seats have opened up in <strong>${sectionId}</strong> for:</p>
          <h3>${match.homeTeam.name} vs ${match.awayTeam.name}</h3>
          <p>Hurry! These tickets are sold on a first-come, first-served basis.</p>
          <a href="${bookingLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Book Now</a>
        </div>
      `
    });
  }
}
