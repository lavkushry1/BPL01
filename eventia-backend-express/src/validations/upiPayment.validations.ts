import Joi from 'joi';

export const upiPaymentValidation = {
    // Validation schema for initiating a payment
    initiatePayment: {
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
            }),
            amount: Joi.number().positive().messages({
                'number.positive': 'Amount must be a positive number'
            })
        })
    },

    // Validation schema for checking payment status
    getPaymentStatus: {
        params: Joi.object().keys({
            sessionId: Joi.string().required().messages({
                'string.empty': 'Session ID is required',
                'any.required': 'Session ID is required'
            })
        })
    },

    // Validation schema for confirming payment
    confirmPayment: {
        body: Joi.object().keys({
            sessionId: Joi.string().required().messages({
                'string.empty': 'Session ID is required',
                'any.required': 'Session ID is required'
            }),
            utrNumber: Joi.string().required().pattern(/^[a-zA-Z0-9]{8,35}$/).messages({
                'string.empty': 'UTR number is required',
                'string.pattern.base': 'UTR number format is invalid',
                'any.required': 'UTR number is required'
            })
        })
    }
};

// Validation schema for creating a new UPI setting
export const createUpiSetting = {
    body: Joi.object().keys({
        upivpa: Joi.string().required().messages({
            'string.empty': 'UPI ID (VPA) is required',
            'any.required': 'UPI ID (VPA) is required'
        }),
        discountamount: Joi.number().min(0).default(0).messages({
            'number.min': 'Discount amount must be a non-negative number'
        }),
        isactive: Joi.boolean().default(true)
    })
};

// Validation schema for updating a UPI setting
export const updateUpiSetting = {
    params: Joi.object().keys({
        id: Joi.string().required().messages({
            'string.empty': 'UPI setting ID is required',
            'any.required': 'UPI setting ID is required'
        })
    }),
    body: Joi.object().keys({
        upivpa: Joi.string().messages({
            'string.empty': 'UPI ID (VPA) cannot be empty'
        }),
        discountamount: Joi.number().min(0).messages({
            'number.min': 'Discount amount must be a non-negative number'
        }),
        isactive: Joi.boolean()
    }).min(1).messages({
        'object.min': 'At least one field is required for update'
    })
}; 