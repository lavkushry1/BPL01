import { SeatStatus } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma';
import { ApiError } from '../../utils/apiError';
import { ApiResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

const matchIdParamSchema = z.object({
  params: z.object({
    matchId: z.string().uuid()
  })
});

const lockSeatsBodySchema = z.object({
  body: z.object({
    seatIds: z.array(z.string().uuid()).min(1),
    lockDurationSeconds: z.number().int().positive().max(60 * 60).optional(),
    lockerId: z.string().min(3).optional()
  })
});

const unlockSeatsBodySchema = z.object({
  body: z.object({
    seatIds: z.array(z.string().uuid()).min(1),
    lockerId: z.string().min(3).optional()
  })
});

const resolveLockerId = (req: Request, lockerIdFromBody?: string): string => {
  const authUserId = req.user?.id;
  if (authUserId) return authUserId;
  if (lockerIdFromBody) return lockerIdFromBody;
  throw ApiError.badRequest('lockerId is required for guest seat locking', 'LOCKER_ID_REQUIRED');
};

const computeEffectiveSeatStatus = (seat: { status: SeatStatus; lockExpiresAt: Date | null }): SeatStatus => {
  if (seat.status !== SeatStatus.LOCKED) return seat.status;
  if (!seat.lockExpiresAt) return SeatStatus.AVAILABLE;
  return seat.lockExpiresAt.getTime() < Date.now() ? SeatStatus.AVAILABLE : SeatStatus.LOCKED;
};

export class MatchesControllerV1 {
  /**
   * GET /api/v1/matches/:matchId/layout
   * Returns stadium SVG geometry + status for every seat.
   *
   * Note: "matchId" maps to Event.id in this codebase (IPL matches are modeled as Events).
   */
  static getMatchLayout = asyncHandler(async (req: Request, res: Response) => {
    matchIdParamSchema.parse({ params: req.params });

    const { matchId } = req.params;
    const requesterId =
      req.user?.id || (typeof req.query.lockerId === 'string' ? req.query.lockerId : null);

    const event = await prisma.event.findUnique({
      where: { id: matchId },
      include: {
        stadium: {
          include: {
            stands: {
              orderBy: { sortOrder: 'asc' },
              include: {
                rows: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    seats: { orderBy: { sortOrder: 'asc' } }
                  }
                }
              }
            }
          }
        },
        ticketCategories: true
      }
    });

    if (!event) {
      throw ApiError.notFound('Match not found', 'MATCH_NOT_FOUND');
    }
    if (!event.stadium) {
      throw ApiError.badRequest('Match has no stadium layout configured', 'MATCH_STADIUM_NOT_CONFIGURED');
    }

    // Optional cleanup: release expired locks for this match so they don't block booking.
    await prisma.seat.updateMany({
      where: {
        eventId: matchId,
        status: SeatStatus.LOCKED,
        lockExpiresAt: { lt: new Date() }
      },
      data: {
        status: SeatStatus.AVAILABLE,
        lockedBy: null,
        lockExpiresAt: null
      }
    });

    const matchSeats = await prisma.seat.findMany({
      where: {
        eventId: matchId,
        stadiumSeatId: { not: null }
      },
      select: {
        id: true,
        stadiumSeatId: true,
        status: true,
        price: true,
        lockedBy: true,
        lockExpiresAt: true,
        ticketCategoryId: true
      }
    });

    const matchSeatByStadiumSeatId = new Map<string, typeof matchSeats[number]>();
    for (const seat of matchSeats) {
      if (seat.stadiumSeatId) {
        matchSeatByStadiumSeatId.set(seat.stadiumSeatId, seat);
      }
    }

    const currency = 'INR';

    const stands = event.stadium.stands.map((stand) => {
      const standTicketCategories = event.ticketCategories.filter((tc) => tc.stadiumStandId === stand.id);
      const standPrice = standTicketCategories.length
        ? Math.min(...standTicketCategories.map((tc) => Number(tc.price)))
        : null;

      let totalSeats = 0;
      let availableSeats = 0;
      let bookedSeats = 0;
      let lockedSeats = 0;
      let blockedSeats = 0;

      const rows = stand.rows.map((row) => {
        const seats = row.seats.map((stadiumSeat) => {
          totalSeats += 1;

          const matchSeat = matchSeatByStadiumSeatId.get(stadiumSeat.id);

          if (!matchSeat) {
            blockedSeats += 1;
            return {
              id: null,
              stadiumSeatId: stadiumSeat.id,
              label: stadiumSeat.label || `${row.label}-${stadiumSeat.seatNumber}`,
              seatNumber: stadiumSeat.seatNumber,
              status: SeatStatus.BLOCKED,
              price: standPrice ?? 0,
              currency,
              lockExpiresAt: null,
              lockedByMe: false
            };
          }

          const effectiveStatus = computeEffectiveSeatStatus({
            status: matchSeat.status,
            lockExpiresAt: matchSeat.lockExpiresAt
          });

          if (effectiveStatus === SeatStatus.AVAILABLE) availableSeats += 1;
          else if (effectiveStatus === SeatStatus.BOOKED || effectiveStatus === SeatStatus.SOLD) bookedSeats += 1;
          else if (effectiveStatus === SeatStatus.LOCKED) lockedSeats += 1;
          else if (effectiveStatus === SeatStatus.BLOCKED || effectiveStatus === SeatStatus.MAINTENANCE) blockedSeats += 1;

          const lockedByMe = requesterId ? matchSeat.lockedBy === requesterId : false;

          return {
            id: matchSeat.id,
            stadiumSeatId: stadiumSeat.id,
            label: stadiumSeat.label || `${row.label}-${stadiumSeat.seatNumber}`,
            seatNumber: stadiumSeat.seatNumber,
            status: effectiveStatus,
            price: matchSeat.price !== null ? Number(matchSeat.price) : (standPrice ?? 0),
            currency,
            lockExpiresAt: matchSeat.lockExpiresAt ? matchSeat.lockExpiresAt.toISOString() : null,
            lockedByMe
          };
        });

        return {
          id: row.id,
          label: row.label,
          seats
        };
      });

      return {
        id: stand.id,
        code: stand.code,
        name: stand.name,
        shortName: stand.shortName,
        svgPath: stand.svgPath,
        price: standPrice,
        currency,
        availability: {
          totalSeats,
          availableSeats,
          bookedSeats,
          lockedSeats,
          blockedSeats,
          isSoldOut: availableSeats === 0
        },
        rows
      };
    });

    return ApiResponse.success(res, 200, 'Match layout fetched successfully', {
      matchId,
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        location: event.location
      },
      stadium: {
        id: event.stadium.id,
        name: event.stadium.name,
        city: event.stadium.city,
        state: event.stadium.state,
        capacity: event.stadium.capacity,
        svgViewBox: event.stadium.svgViewBox || '0 0 500 400'
      },
      stands,
      lockDurationSeconds: 240,
      serverTime: new Date().toISOString()
    });
  });

  /**
   * POST /api/v1/matches/:matchId/seats/lock
   * Atomically locks seats for a short TTL to prevent double selection.
   */
  static lockSeats = asyncHandler(async (req: Request, res: Response) => {
    matchIdParamSchema.parse({ params: req.params });
    lockSeatsBodySchema.parse({ body: req.body });

    const { matchId } = req.params;
    const { seatIds, lockDurationSeconds = 240, lockerId } = req.body as z.infer<typeof lockSeatsBodySchema>['body'];

    const locker = resolveLockerId(req, lockerId);
    const uniqueSeatIds = Array.from(new Set(seatIds));

    const now = new Date();
    const expiresAt = new Date(now.getTime() + lockDurationSeconds * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.seat.updateMany({
        where: {
          eventId: matchId,
          id: { in: uniqueSeatIds },
          OR: [
            { status: SeatStatus.AVAILABLE },
            { status: SeatStatus.LOCKED, lockExpiresAt: { lt: now } },
            { status: SeatStatus.LOCKED, lockedBy: locker }
          ]
        },
        data: {
          status: SeatStatus.LOCKED,
          lockedBy: locker,
          lockExpiresAt: expiresAt
        }
      });

      if (updateResult.count !== uniqueSeatIds.length) {
        const current = await tx.seat.findMany({
          where: { eventId: matchId, id: { in: uniqueSeatIds } },
          select: { id: true, status: true, lockedBy: true, lockExpiresAt: true }
        });
        throw ApiError.conflict('One or more seats could not be locked', 'SEAT_LOCK_CONFLICT', {
          seats: current.map((s) => ({
            id: s.id,
            status: computeEffectiveSeatStatus({ status: s.status, lockExpiresAt: s.lockExpiresAt }),
            lockExpiresAt: s.lockExpiresAt ? s.lockExpiresAt.toISOString() : null
          }))
        });
      }

      return { expiresAt };
    });

    return ApiResponse.success(res, 200, 'Seats locked successfully', {
      matchId,
      seatIds: uniqueSeatIds,
      lockedBy: req.user?.id ? 'user' : 'guest',
      lockExpiresAt: result.expiresAt.toISOString()
    });
  });

  /**
   * POST /api/v1/matches/:matchId/seats/unlock
   * Releases locks held by the current user / lockerId.
   */
  static unlockSeats = asyncHandler(async (req: Request, res: Response) => {
    matchIdParamSchema.parse({ params: req.params });
    unlockSeatsBodySchema.parse({ body: req.body });

    const { matchId } = req.params;
    const { seatIds, lockerId } = req.body as z.infer<typeof unlockSeatsBodySchema>['body'];
    const locker = resolveLockerId(req, lockerId);
    const uniqueSeatIds = Array.from(new Set(seatIds));

    const updateResult = await prisma.seat.updateMany({
      where: {
        eventId: matchId,
        id: { in: uniqueSeatIds },
        status: SeatStatus.LOCKED,
        lockedBy: locker
      },
      data: {
        status: SeatStatus.AVAILABLE,
        lockedBy: null,
        lockExpiresAt: null
      }
    });

    return ApiResponse.success(res, 200, 'Seats unlocked successfully', {
      matchId,
      seatIds: uniqueSeatIds,
      unlockedCount: updateResult.count
    });
  });
}
