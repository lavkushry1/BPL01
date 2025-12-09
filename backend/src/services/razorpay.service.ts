// Custom UPI payment service for direct UPI payments
import crypto from 'crypto';
import config from '../config';

/**
 * Generates a UPI payment link
 * @param amount Amount in smallest currency unit (paise for INR)
 * @param referenceId Transaction reference ID
 * @param options Additional options
 * @returns UPI payment link
 */
export const generateUpiLink = (amount: number, referenceId: string, options: any = {}) => {
    // Format: upi://pay?params
    const params = {
        pa: config.razorpay.merchantUpiId, // VPA (UPI ID) of the merchant
        pn: config.razorpay.merchantName,  // Merchant name
        tr: referenceId,                   // Transaction reference ID
        am: (amount / 100).toFixed(2),     // Amount (in rupees, not paise)
        cu: 'INR',                         // Currency
        tn: options.note || 'Payment for Eventia tickets' // Transaction note
    };

    // Convert params to URL query string
    const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
        .join('&');

    return `upi://pay?${queryString}`;
};

/**
 * Generates a QR code payload for UPI payment
 * @param amount Amount in smallest currency unit (paise for INR)
 * @param referenceId Reference ID for the transaction
 * @param options Additional options
 * @returns Data to be encoded in QR code
 */
export const generateQrCodeData = (amount: number, referenceId: string, options: any = {}) => {
    return generateUpiLink(amount, referenceId, options);
};

/**
 * Validates a webhook signature from UPI provider
 * @param payload The webhook payload (request body)
 * @param signature X-Signature header value
 * @returns Whether the signature is valid
 */
export const validateWebhookSignature = (payload: any, signature: string): boolean => {
    try {
        // Convert payload to string if it's an object
        const payloadString = typeof payload === 'string'
            ? payload
            : JSON.stringify(payload);

        // Generate signature using HMAC SHA256
        const expectedSignature = crypto
            .createHmac('sha256', config.razorpay.webhookSecret)
            .update(payloadString)
            .digest('hex');

        // Verify signature
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error('Error validating webhook signature:', error);
        return false;
    }
};

/**
 * Verifies a UPI payment by UTR number
 * @param utrNumber UPI Transaction Reference number
 * @returns Payment verification result
 */
export const verifyUpiPayment = async (utrNumber: string) => {
    // In a real implementation, verify UTR number with bank or UPI service provider
    // For this mock implementation, we'll assume all UTR numbers are valid if they match the pattern
    const utrPattern = /^[a-zA-Z0-9]{12,22}$/;
    const isValidFormat = utrPattern.test(utrNumber);

    return {
        verified: isValidFormat,
        payment: isValidFormat ? {
            id: `upi_${Date.now()}`,
            status: 'verified',
            utrNumber: utrNumber,
            amount: 0, // This would come from your database in a real implementation
            currency: 'INR',
            method: 'upi',
            verified: true
        } : null
    };
}; 