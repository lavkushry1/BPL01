import Stripe from 'stripe';
import config from '../config';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil', // Use the latest API version
});

/**
 * Service for handling Stripe payment operations
 */
export const stripeService = {
  /**
   * Create a payment intent for a Stripe payment
   * @param amount Amount in smallest currency unit (paise for INR)
   * @param currency Currency code (default: INR)
   * @param metadata Additional metadata for the payment
   * @returns Payment intent object
   */
  async createPaymentIntent(amount: number, currency: string = 'inr', metadata: Record<string, string> = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
        payment_method_types: ['card'],
      });
      
      return paymentIntent;
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      throw error;
    }
  },

  /**
   * Retrieve a payment intent by ID
   * @param paymentIntentId The ID of the payment intent to retrieve
   * @returns Payment intent object
   */
  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error retrieving Stripe payment intent:', error);
      throw error;
    }
  },

  /**
   * Confirm a payment intent
   * @param paymentIntentId The ID of the payment intent to confirm
   * @param paymentMethodId The ID of the payment method to use
   * @returns Confirmed payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error confirming Stripe payment intent:', error);
      throw error;
    }
  },

  /**
   * Verify a webhook signature from Stripe
   * @param payload The webhook payload (request body)
   * @param signature Stripe-Signature header value
   * @returns Event object if signature is valid
   */
  verifyWebhookSignature(payload: any, signature: string) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
      return event;
    } catch (error) {
      console.error('Error verifying Stripe webhook signature:', error);
      throw error;
    }
  },

  /**
   * Create a refund for a payment
   * @param paymentIntentId The ID of the payment intent to refund
   * @param amount Amount to refund (if not provided, refunds entire amount)
   * @returns Refund object
   */
  async createRefund(paymentIntentId: string, amount?: number) {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = amount;
      }

      const refund = await stripe.refunds.create(refundParams);
      return refund;
    } catch (error) {
      console.error('Error creating Stripe refund:', error);
      throw error;
    }
  },
};