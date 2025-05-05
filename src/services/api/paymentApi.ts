/**
 * @service PaymentApiService
 * @description Service for handling payment-related API calls to the Express backend.
 */
import { defaultApiClient } from './apiUtils';
import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { apiClient } from './client';

export interface UpiPaymentRequest {
    bookingId: string;
    utrNumber?: string;
    paymentDate?: string;
}

export interface CreatePaymentInput {
    bookingId: string;
    amount: number;
    paymentMethod: string;
    customerDetails?: {
        name: string;
        email: string;
        phone: string;
    };
}

export interface UpiSettings {
    upivpa: string;
    active: boolean;
}

// Get active UPI settings for the application
export const getActiveUpiSettings = async (): Promise<UpiSettings | null> => {
    try {
        const response = await apiClient.get('/payments/upi-settings');
        if (response.data?.data?.vpa) {
            return {
                upivpa: response.data.data.vpa,
                active: true
            };
        }

        // Provide a fallback even when API fails
        console.log('No UPI settings found in API response. Using fallback.');
        return {
            upivpa: 'eventia@okicici',
            active: true
        };
    } catch (error) {
        console.error('Error fetching UPI settings:', error);
        // Fallback value for reliability
        return {
            upivpa: 'eventia@okicici',
            active: true
        };
    }
};

/**
 * Get payment settings for UPI and other methods
 */
export const getPaymentSettings = () => {
    return apiClient.get<any>('/payments/settings');
};

/**
 * Get payment by booking ID
 */
export const getPaymentByBookingId = (bookingId: string) => {
    return apiClient.get<any>(`/payments/booking/${bookingId}`);
};

/**
 * Create a new payment
 */
export const createPayment = async (paymentData: CreatePaymentInput): Promise<{ data: { data: any } }> => {
    return apiClient.post<any>('/payments', paymentData);
};

/**
 * Get payment status
 */
export const getPaymentStatus = (intentId: string) => {
    return apiClient.get<any>(`/payments/status/${intentId}`);
};

/**
 * Verify payment status
 */
export const verifyPayment = async (bookingId: string): Promise<{ success: boolean; status: string; message: string }> => {
    try {
        const response = await apiClient.post(`/payments/verify/${bookingId}`);
        return {
            success: true,
            status: response.data.status,
            message: response.data.message
        };
    } catch (error) {
        return {
            success: false,
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to verify payment'
        };
    }
};

/**
 * Generate UPI QR Code and Payment URL
 * @param amount - Payment amount
 * @param reference - Reference ID (booking ID)
 * @returns Object with QR code URL and UPI deep link URL
 */
export const generateUpiQrCode = async (amount: number, reference: string): Promise<{ qrUrl: string, upiUrl: string }> => {
    try {
        const upiSettings = await getActiveUpiSettings();

        // Format: upi://pay?pa=[UPI_ID]&pn=[NAME]&am=[AMOUNT]&cu=[CURRENCY]&tn=[NOTE]
        const upiUrl = `upi://pay?pa=${upiSettings.upivpa}&pn=EventiaApp&am=${amount}&cu=INR&tn=EventBooking-${reference}`;

        try {
            // Try to generate QR code from the backend
            const response = await apiClient.post('/payments/generate-qr', {
                data: upiUrl
            });

            return {
                qrUrl: response.data.data.qrCodeUrl,
                upiUrl
            };
        } catch (qrError) {
            // Use public QR code service as fallback
            console.error('API QR generation failed, using public service fallback:', qrError);
            const encodedValue = encodeURIComponent(upiUrl);

            return {
                qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedValue}`,
                upiUrl
            };
        }
    } catch (error) {
        console.error('Error generating UPI QR code:', error);

        // Create a completely reliable fallback
        const fallbackVpa = 'eventia@okicici';
        const fallbackUrl = `upi://pay?pa=${fallbackVpa}&pn=EventiaApp&am=${amount}&cu=INR&tn=EventBooking-${reference}`;
        const encodedValue = encodeURIComponent(fallbackUrl);

        return {
            qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedValue}`,
            upiUrl: fallbackUrl
        };
    }
}; 