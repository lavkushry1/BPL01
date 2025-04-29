"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../utils/logger");
const db_1 = require("../db");
const config_1 = require("../config");
const retry_1 = require("../utils/retry");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const handlebars_1 = __importDefault(require("handlebars"));
/**
 * Service for sending emails
 */
class EmailService {
    static transporter = nodemailer_1.default.createTransport({
        host: config_1.config.email.host,
        port: config_1.config.email.port,
        secure: config_1.config.email.secure,
        auth: {
            user: config_1.config.email.user,
            pass: config_1.config.email.password
        }
    });
    /**
     * Initialize the email service
     */
    static async initialize() {
        try {
            // Verify connection configuration
            await this.transporter.verify();
            logger_1.logger.info('Email service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize email service:', error);
        }
    }
    /**
     * Load an email template and compile it with Handlebars
     * @param templateName Name of the template file (without extension)
     * @param data Data to inject into the template
     * @returns Compiled HTML
     */
    static async compileTemplate(templateName, data) {
        try {
            const templatePath = path_1.default.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
            // Check if template exists, if not use a fallback
            if (!fs_1.default.existsSync(templatePath)) {
                logger_1.logger.warn(`Email template ${templateName} not found, using fallback`);
                return this.compileFallbackTemplate(data);
            }
            const templateContent = fs_1.default.readFileSync(templatePath, 'utf8');
            const template = handlebars_1.default.compile(templateContent);
            return template(data);
        }
        catch (error) {
            logger_1.logger.error(`Error compiling email template ${templateName}:`, error);
            return this.compileFallbackTemplate(data);
        }
    }
    /**
     * Fallback template when the main template is not available
     * @param data Template data
     * @returns Basic HTML email
     */
    static compileFallbackTemplate(data) {
        const fallbackTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .content { margin-bottom: 20px; }
          .footer { text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>{{title}}</h1>
          </div>
          <div class="content">
            <p>{{message}}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eventia. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        const template = handlebars_1.default.compile(fallbackTemplate);
        return template(data);
    }
    /**
     * Send an email
     * @param to Recipient email
     * @param subject Email subject
     * @param html Email HTML content
     * @param from Optional sender email (default: configured email)
     * @returns Email send result
     */
    static async sendMail(to, subject, html, from = config_1.config.email.from) {
        try {
            const result = await (0, retry_1.withRetry)(async () => await this.transporter.sendMail({
                from,
                to,
                subject,
                html
            }), {
                maxAttempts: 3,
                delay: 1000,
                backoff: true
            });
            logger_1.logger.info(`Email sent to ${to}: ${subject}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Failed to send email to ${to}:`, error);
            return false;
        }
    }
    /**
     * Send a payment verification email
     * @param bookingId Booking ID
     * @returns Success status
     */
    static async sendPaymentVerificationEmail(bookingId) {
        try {
            // Get booking details
            const booking = await (0, db_1.db)('bookings')
                .where('id', bookingId)
                .first();
            if (!booking) {
                logger_1.logger.error(`Cannot send payment verification email - booking ${bookingId} not found`);
                return false;
            }
            // Get user details
            const user = await (0, db_1.db)('users')
                .where('id', booking.user_id)
                .first();
            if (!user || !user.email) {
                logger_1.logger.error(`Cannot send payment verification email - user email not found for booking ${bookingId}`);
                return false;
            }
            // Get event details
            const event = await (0, db_1.db)('events')
                .where('id', booking.event_id)
                .first();
            if (!event) {
                logger_1.logger.error(`Cannot send payment verification email - event not found for booking ${bookingId}`);
                return false;
            }
            // Get tickets
            const tickets = await (0, db_1.db)('tickets')
                .where('booking_id', bookingId)
                .select('id', 'ticket_number');
            // Compile template with data
            const templateData = {
                userName: user.name || 'Valued Customer',
                bookingId,
                eventName: event.title,
                eventDate: new Date(event.start_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                eventTime: new Date(event.start_date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                tickets: tickets.map(ticket => ({
                    id: ticket.id,
                    number: ticket.ticket_number
                })),
                ticketCount: tickets.length,
                totalAmount: booking.final_amount,
                currency: booking.currency || 'INR',
                viewTicketsUrl: `${config_1.config.clientUrl}/bookings/${bookingId}`,
                supportEmail: config_1.config.supportEmail || 'support@eventia.com'
            };
            const html = await this.compileTemplate('payment-verification', templateData);
            // Send the email
            return await this.sendMail(user.email, `Payment Confirmed for ${event.title} - Booking #${bookingId}`, html);
        }
        catch (error) {
            logger_1.logger.error(`Error sending payment verification email for booking ${bookingId}:`, error);
            return false;
        }
    }
    /**
     * Send a payment rejection email
     * @param bookingId Booking ID
     * @param reason Rejection reason
     * @returns Success status
     */
    static async sendPaymentRejectionEmail(bookingId, reason = 'Payment verification failed') {
        try {
            // Get booking details
            const booking = await (0, db_1.db)('bookings')
                .where('id', bookingId)
                .first();
            if (!booking) {
                logger_1.logger.error(`Cannot send payment rejection email - booking ${bookingId} not found`);
                return false;
            }
            // Get user details
            const user = await (0, db_1.db)('users')
                .where('id', booking.user_id)
                .first();
            if (!user || !user.email) {
                logger_1.logger.error(`Cannot send payment rejection email - user email not found for booking ${bookingId}`);
                return false;
            }
            // Get event details
            const event = await (0, db_1.db)('events')
                .where('id', booking.event_id)
                .first();
            if (!event) {
                logger_1.logger.error(`Cannot send payment rejection email - event not found for booking ${bookingId}`);
                return false;
            }
            // Get payment details
            const payment = await (0, db_1.db)('booking_payments')
                .where('booking_id', bookingId)
                .first();
            // Compile template with data
            const templateData = {
                userName: user.name || 'Valued Customer',
                bookingId,
                eventName: event.title,
                paymentId: payment?.id || 'N/A',
                reason,
                amount: booking.final_amount,
                currency: booking.currency || 'INR',
                retryPaymentUrl: `${config_1.config.clientUrl}/bookings/${bookingId}/payment`,
                supportEmail: config_1.config.supportEmail || 'support@eventia.com'
            };
            const html = await this.compileTemplate('payment-rejection', templateData);
            // Send the email
            return await this.sendMail(user.email, `Payment Rejected for ${event.title} - Booking #${bookingId}`, html);
        }
        catch (error) {
            logger_1.logger.error(`Error sending payment rejection email for booking ${bookingId}:`, error);
            return false;
        }
    }
    /**
     * Send a ticket generation email
     * @param bookingId Booking ID
     * @returns Success status
     */
    static async sendTicketGenerationEmail(bookingId) {
        try {
            // Get booking details
            const booking = await (0, db_1.db)('bookings')
                .where('id', bookingId)
                .first();
            if (!booking) {
                logger_1.logger.error(`Cannot send ticket generation email - booking ${bookingId} not found`);
                return false;
            }
            // Get user details
            const user = await (0, db_1.db)('users')
                .where('id', booking.user_id)
                .first();
            if (!user || !user.email) {
                logger_1.logger.error(`Cannot send ticket generation email - user email not found for booking ${bookingId}`);
                return false;
            }
            // Get event details
            const event = await (0, db_1.db)('events')
                .where('id', booking.event_id)
                .first();
            if (!event) {
                logger_1.logger.error(`Cannot send ticket generation email - event not found for booking ${bookingId}`);
                return false;
            }
            // Get tickets
            const tickets = await (0, db_1.db)('tickets')
                .where('booking_id', bookingId)
                .select('id', 'ticket_number', 'qr_code_url');
            if (tickets.length === 0) {
                logger_1.logger.error(`Cannot send ticket generation email - no tickets found for booking ${bookingId}`);
                return false;
            }
            // Compile template with data
            const templateData = {
                userName: user.name || 'Valued Customer',
                bookingId,
                eventName: event.title,
                eventDate: new Date(event.start_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                eventTime: new Date(event.start_date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                tickets: tickets.map(ticket => ({
                    id: ticket.id,
                    number: ticket.ticket_number,
                    downloadUrl: `${config_1.config.clientUrl}/tickets/${ticket.id}/download`
                })),
                ticketCount: tickets.length,
                venueAddress: event.venue_address || 'Venue address will be announced soon',
                viewTicketsUrl: `${config_1.config.clientUrl}/bookings/${bookingId}/tickets`,
                supportEmail: config_1.config.supportEmail || 'support@eventia.com'
            };
            const html = await this.compileTemplate('ticket-generation', templateData);
            // Send the email
            return await this.sendMail(user.email, `Your Tickets for ${event.title} are Ready!`, html);
        }
        catch (error) {
            logger_1.logger.error(`Error sending ticket generation email for booking ${bookingId}:`, error);
            return false;
        }
    }
}
exports.EmailService = EmailService;
