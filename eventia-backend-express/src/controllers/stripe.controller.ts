import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service';
import { paymentService } from '../services/payment.service';
import { transactionService } from '../services/transaction.service';
import { Payment } from '../models/payment.model';
import httpStatus from 'http-status';

export class StripeController {
  /**
   * Initialize a Stripe payment
   * @param req Request object
   * @param res Response object
   */
  async initializePayment(req: Request, res: Response) {
    try {
      const { bookingId, amount, currency = 'inr' } = req.body;

      if (!bookingId || !amount) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Booking ID and amount are required',
        });
      }

      // Check if there's an existing payment for this booking
      const existingPayment = await paymentService.getPaymentByBookingId(bookingId);
      if (existingPayment && existingPayment.status === 'verified') {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Payment already verified for this booking',
        });
      }

      // Create metadata for the payment intent
      const metadata = {
        bookingId,
        paymentType: 'stripe',
      };

      // Create a payment intent with Stripe
      const paymentIntent = await stripeService.createPaymentIntent(amount, currency, metadata);

      // Start a transaction
      await transactionService.transaction(async (trx) => {
        // Create a payment record in our database
        const payment: Omit<Payment, 'id' | 'created_at'> = {
          booking_id: bookingId,
          amount,
          currency,
          status: 'pending',
          payment_method: 'stripe',
          payment_intent_id: paymentIntent.id,
          payment_date: new Date(),
        };

        await paymentService.createPayment(payment);
      });

      return res.status(httpStatus.OK).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error('Error initializing Stripe payment:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to initialize payment',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Handle Stripe webhook events
   * @param req Request object
   * @param res Response object
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Stripe signature is missing',
        });
      }

      // Verify the webhook signature
      const event = stripeService.verifyWebhookSignature(req.body, signature);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        // Add more event handlers as needed
      }

      return res.status(httpStatus.OK).json({ received: true });
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Webhook error',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Handle successful payment intent
   * @param paymentIntent Payment intent object from Stripe
   */
  private async handlePaymentIntentSucceeded(paymentIntent: any) {
    try {
      const { bookingId } = paymentIntent.metadata;

      if (!bookingId) {
        console.error('No booking ID found in payment intent metadata');
        return;
      }

      // Get the payment by booking ID
      const payment = await paymentService.getPaymentByBookingId(bookingId);

      if (!payment) {
        console.error(`No payment found for booking ID: ${bookingId}`);
        return;
      }

      // Update payment status to verified
      await transactionService.transaction(async (trx) => {
        await paymentService.verifyPayment(payment.id, 'system');
      });

      console.log(`Payment for booking ${bookingId} verified successfully`);
    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
    }
  }

  /**
   * Handle failed payment intent
   * @param paymentIntent Payment intent object from Stripe
   */
  private async handlePaymentIntentFailed(paymentIntent: any) {
    try {
      const { bookingId } = paymentIntent.metadata;

      if (!bookingId) {
        console.error('No booking ID found in payment intent metadata');
        return;
      }

      // Get the payment by booking ID
      const payment = await paymentService.getPaymentByBookingId(bookingId);

      if (!payment) {
        console.error(`No payment found for booking ID: ${bookingId}`);
        return;
      }

      // Update payment status to rejected
      await transactionService.transaction(async (trx) => {
        await paymentService.rejectPayment(payment.id, 'system');
      });

      console.log(`Payment for booking ${bookingId} marked as rejected due to failure`);
    } catch (error) {
      console.error('Error handling payment intent failed:', error);
    }
  }

  /**
   * Get payment status
   * @param req Request object
   * @param res Response object
   */
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentIntentId } = req.params;

      if (!paymentIntentId) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Payment intent ID is required',
        });
      }

      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);

      return res.status(httpStatus.OK).json({
        success: true,
        status: paymentIntent.status,
        paymentIntent,
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to get payment status',
        error: (error as Error).message,
      });
    }
  }
}

export const stripeController = new StripeController();