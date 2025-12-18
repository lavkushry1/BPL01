import { Router } from 'express';
import { z } from 'zod';
import { MatchesControllerV1 } from '../../controllers/v1/matches.controller';
import { optionalAuthenticate } from '../../middleware/auth';
import { standardLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

const matchIdParamSchema = z.object({
  params: z.object({
    matchId: z.string().uuid()
  }),
  query: z.object({
    lockerId: z.string().min(3).optional()
  }).optional(),
  body: z.object({}).optional()
});

const lockSeatsSchema = z.object({
  params: z.object({
    matchId: z.string().uuid()
  }),
  body: z.object({
    seatIds: z.array(z.string().uuid()).min(1),
    lockDurationSeconds: z.number().int().positive().max(60 * 60).optional(),
    lockerId: z.string().min(3).optional()
  })
});

const unlockSeatsSchema = z.object({
  params: z.object({
    matchId: z.string().uuid()
  }),
  body: z.object({
    seatIds: z.array(z.string().uuid()).min(1),
    lockerId: z.string().min(3).optional()
  })
});

const zoneSeatsSchema = z.object({
  params: z.object({
    matchId: z.string().uuid(),
    zoneId: z.string().uuid()
  }),
  query: z.object({
    lockerId: z.string().min(3).optional()
  }).optional(),
  body: z.object({}).optional()
});

/**
 * Match (Event) stadium layout endpoints (BookMyShow-like).
 *
 * NOTE: In this repo "matchId" maps to Event.id for IPL matches.
 */
router.get(
  '/:matchId/layout',
  standardLimiter,
  optionalAuthenticate,
  validate(matchIdParamSchema),
  asyncHandler(MatchesControllerV1.getMatchLayout)
);

router.get(
  '/:matchId/zones/:zoneId/seats',
  standardLimiter,
  optionalAuthenticate,
  validate(zoneSeatsSchema),
  asyncHandler(MatchesControllerV1.getZoneSeats)
);

router.post(
  '/:matchId/seats/lock',
  standardLimiter,
  optionalAuthenticate,
  validate(lockSeatsSchema),
  asyncHandler(MatchesControllerV1.lockSeats)
);

router.post(
  '/:matchId/seats/unlock',
  standardLimiter,
  optionalAuthenticate,
  validate(unlockSeatsSchema),
  asyncHandler(MatchesControllerV1.unlockSeats)
);

export default router;
