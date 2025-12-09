import Joi from 'joi';
import { z } from 'zod';

// Validation schema for initiating a payment
export const initiatePayment = {
    body: Joi.object().keys({
        eventId: Joi.string().required().messages({
            'string.empty': 'Event ID is required',
            'any.required': 'Event ID is required'
        }),
        seatIds: Joi.array().items(Joi.string()).min(1).required().messages({
            'array.min': 'At least one seat must be selected',
            'any.required': 'Seat IDs are required'
        }),
        userId: Joi.string().required().messages({
            'string.empty': 'User ID is required',
            'any.required': 'User ID is required'
        })
    })
};

// Validation schema for checking payment status
export const getPaymentStatus = {
    params: Joi.object().keys({
        intentId: Joi.string().required().messages({
            'string.empty': 'Payment intent ID is required',
            'any.required': 'Payment intent ID is required'
        })
    })
};

// Validation schema for getting payment by booking ID
export const getPaymentByBooking = {
    params: Joi.object().keys({
        bookingId: Joi.string().required().messages({
            'string.empty': 'Booking ID is required',
            'any.required': 'Booking ID is required'
        })
    })
};

// Validation schema for UPI payments
export const upiPayment = {
    body: Joi.object().keys({
        bookingId: Joi.string().required(),
        utrNumber: Joi.string().required().min(6).max(30).messages({
            'string.empty': 'UTR number is required',
            'string.min': 'UTR number must be at least 6 characters',
            'string.max': 'UTR number cannot exceed 30 characters',
            'any.required': 'UTR number is required'
        }),
        paymentMethod: Joi.string().valid('upi').required(),
        paymentDetails: Joi.object().keys({
            upiId: Joi.string().required(),
            paymentDate: Joi.date().iso()
        }).required()
    })
};

// Validation schema for recording UPI payment
export const recordUpiPayment = {
    body: Joi.object().keys({
        bookingId: Joi.string().required().messages({
            'string.empty': 'Booking ID is required',
            'any.required': 'Booking ID is required'
        }),
        utrNumber: Joi.string().required().min(6).max(30).messages({
            'string.empty': 'UTR number is required',
            'string.min': 'UTR number must be at least 6 characters',
            'string.max': 'UTR number cannot exceed 30 characters',
            'any.required': 'UTR number is required'
        }),
        paymentDate: Joi.date().iso().allow(null)
    })
};

// Validation schema for verifying UPI payment
export const verifyUpiPayment = {
    body: Joi.object().keys({
        payment_id: Joi.string().required().messages({
            'string.empty': 'Payment ID is required',
            'any.required': 'Payment ID is required'
        }),
        utr_number: Joi.string().required().min(6).max(30).messages({
            'string.empty': 'UTR number is required',
            'string.min': 'UTR number must be at least 6 characters',
            'string.max': 'UTR number cannot exceed 30 characters',
            'any.required': 'UTR number is required'
        })
    })
};

// Generate UPI QR code schema
export const generateUpiQr = z.object({
    body: z.object({
        data: z.string({
            required_error: 'UPI data string is required',
            invalid_type_error: 'UPI data must be a string'
        })
    })
}); 