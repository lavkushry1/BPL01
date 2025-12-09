import { z } from 'zod';

export const upiPaymentValidation = {
    // Validation schema for initiating a payment
    initiatePayment: z.object({
        body: z.object({
            eventId: z.string({
                required_error: 'Event ID is required'
            }),
        seatIds: z.array(z.string()).min(1, 'At least one seat must be selected'),
        userId: z.string({
            required_error: 'User ID is required'
        }),
        amount: z.number().positive('Amount must be a positive number').optional()
    })
  }),

    // Validation schema for checking payment status
    getPaymentStatus: z.object({
        params: z.object({
            sessionId: z.string({
                required_error: 'Session ID is required'
            })
        })
  }),

    // Validation schema for confirming payment
    confirmPayment: z.object({
        body: z.object({
            sessionId: z.string({
                required_error: 'Session ID is required'
            }),
        utrNumber: z.string({
            required_error: 'UTR number is required'
        }).regex(/^[a-zA-Z0-9]{8,35}$/, 'UTR number format is invalid')
    })
  })
};

// Validation schema for creating a new UPI setting
export const createUpiSetting = z.object({
    body: z.object({
        upivpa: z.string({
            required_error: 'UPI ID (VPA) is required'
        }),
      discountamount: z.number().min(0, 'Discount amount must be a non-negative number').default(0),
      isactive: z.boolean().default(true)
  })
});

// Validation schema for updating a UPI setting
export const updateUpiSetting = z.object({
    params: z.object({
        id: z.string({
            required_error: 'UPI setting ID is required'
        })
    }),
    body: z.object({
        upivpa: z.string().optional(),
        discountamount: z.number().min(0, 'Discount amount must be a non-negative number').optional(),
        isactive: z.boolean().optional()
    })
});
