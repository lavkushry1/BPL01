import { defaultApiClient, handleApiResponse, handleApiError } from './apiUtils';

// Payment API types
export interface UpiSettings {
    id: string;
    upivpa: string;
    discountamount: number;
    isactive: boolean;
    created_at: string;
    updated_at: string;
}

export interface RecordUpiPaymentInput {
    bookingId: string;
    utrNumber: string;
    paymentDate?: string | null;
}

export interface UpdateUpiSettingInput {
    upivpa?: string;
    discountamount?: number;
    isactive?: boolean;
}

/**
 * Record a UPI payment
 */
export const recordUpiPayment = async (data: RecordUpiPaymentInput) => {
    try {
        const response = await defaultApiClient.post('/payments/upi', data);
        return handleApiResponse(response);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Verify a payment
 */
export const verifyPayment = async (paymentId: string, verifierId: string) => {
    try {
        const response = await defaultApiClient.post(`/payments/${paymentId}/verify`, { verifierId });
        return handleApiResponse(response);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Get active UPI settings
 */
export const getActiveUpiSettings = async () => {
    try {
        const response = await defaultApiClient.get('/admin/upi-settings/active');
        return handleApiResponse(response);
    } catch (error) {
        throw handleApiError(error);
    }
};

/**
 * Update UPI setting
 */
export const updateUpiSetting = async (id: string, data: UpdateUpiSettingInput) => {
    try {
        const response = await defaultApiClient.put(`/admin/upi-settings/${id}`, data);
        return handleApiResponse(response);
    } catch (error) {
        throw handleApiError(error);
    }
}; 