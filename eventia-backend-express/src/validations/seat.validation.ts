import { z } from 'zod';

export const bulkSeatAvailabilitySchema = z.object({
  body: z.object({
    seat_ids: z.array(z.string()).min(1, 'At least one seat ID is required'),
    event_id: z.string().min(1, 'Event ID is required')
  }),
  params: z.object({}),
  query: z.object({})
});

export const seatReservationSchema = z.object({
  body: z.object({
    seat_ids: z.array(z.string()).min(1, 'At least one seat ID is required'),
    user_id: z.string().min(1, 'User ID is required'),
    expiration: z.number().min(1).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const releaseReservationSchema = z.object({
  body: z.object({
    seat_ids: z.array(z.string()).min(1, 'At least one seat ID is required'),
    user_id: z.string().min(1, 'User ID is required')
  }),
  params: z.object({}),
  query: z.object({})
});

export const updateSeatStatusSchema = z.object({
  body: z.object({
    status: z.enum(['available', 'booked', 'locked', 'selected'], {
      errorMap: () => ({ message: 'Invalid seat status' })
    })
  }),
  params: z.object({
    id: z.string().min(1, 'Seat ID is required')
  }),
  query: z.object({})
});

export const lockSeatsSchema = z.object({
  body: z.object({
    seat_ids: z.array(z.string()).min(1, 'At least one seat ID is required'),
    user_id: z.string().min(1, 'User ID is required'),
    event_id: z.string().min(1, 'Event ID is required'),
    lock_duration: z.number().min(1).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const unlockSeatsSchema = z.object({
  body: z.object({
    seat_ids: z.array(z.string()).min(1, 'At least one seat ID is required'),
    user_id: z.string().min(1, 'User ID is required')
  }),
  params: z.object({}),
  query: z.object({})
});

export const getSeatsSchema = z.object({
  params: z.object({
    venueId: z.string().min(1, 'Venue ID is required'),
    sectionId: z.string().min(1, 'Section ID is required')
  })
});
