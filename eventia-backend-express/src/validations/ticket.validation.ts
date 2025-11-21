import { z } from 'zod';

export const generateTicketsSchema = z.object({
  body: z.object({
    booking_id: z.string().uuid('Invalid booking ID format'),
    event_id: z.string().uuid('Invalid event ID format'),
    user_id: z.string().uuid('Invalid user ID format'),
    email: z.string().email('Invalid email format').optional(),
    send_email: z.boolean().optional().default(true)
  })
});

export const checkInTicketSchema = z.object({
  body: z.object({
    ticket_id: z.string().uuid('Invalid ticket ID format'),
    event_id: z.string().uuid('Invalid event ID format'),
    check_in_location: z.string().optional(),
    device_id: z.string().optional(),
    notes: z.string().optional()
  })
});

export const resendTicketSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ticket ID format')
  }),
  body: z.object({
    email: z.string().email('Invalid email format').optional()
  })
});

export const cancelTicketSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ticket ID format')
  }),
  body: z.object({
    reason: z.string().optional()
  })
});

export const getTicketSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ticket ID format')
  })
});

export const getTicketsByBookingSchema = z.object({
  params: z.object({
    booking_id: z.string().uuid('Invalid booking ID format')
  })
});

export const verifyTicketSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ticket ID format')
  }),
  query: z.object({
    event_id: z.string().uuid('Invalid event ID format')
  })
});
