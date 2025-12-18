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

const matchZoneParamSchema = z.object({
  params: z.object({
    matchId: z.string().uuid(),
    zoneId: z.string().uuid()
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

const DEFAULT_LOCK_SECONDS = 300; // 5 minutes (BookMyShow-like hold)
const MAX_SEATS_PER_LOCKER = 4;

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

const getRequesterLockerId = (req: Request): string | null => {
  if (req.user?.id) return req.user.id;
  if (typeof req.query.lockerId === 'string' && req.query.lockerId.trim().length > 0) {
    return req.query.lockerId.trim();
  }
  return null;
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'bigint') return Number(value);
  return Number(value);
};

export class MatchesControllerV1 {
  /**
   * GET /api/v1/matches/:matchId/layout
   * Returns stadium SVG geometry + stand (zone) summaries only.
   * Seats are fetched lazily via GET /api/v1/matches/:matchId/zones/:zoneId/seats
   *
   * Note: "matchId" maps to Event.id in this codebase (IPL matches are modeled as Events).
   */
  static getMatchLayout = asyncHandler(async (req: Request, res: Response) => {
    matchIdParamSchema.parse({ params: req.params });

    const { matchId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        title: true,
        startDate: true,
        location: true,
        stadium: {
          select: {
            id: true,
            name: true,
            svgViewBox: true,
            stands: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                code: true,
                name: true,
                svgPath: true,
                sortOrder: true
              }
            }
          }
        },
        ticketCategories: {
          select: {
            id: true,
            price: true,
            stadiumStandId: true
          }
        }
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

    type StandCountsRow = {
      stand_id: string;
      total_seats: bigint;
      available_seats: bigint;
    };

    const standCounts = await prisma.$queryRaw<StandCountsRow[]>`
      SELECT
        ss.id AS stand_id,
        COALESCE(COUNT(s.id), 0) AS total_seats,
        COALESCE(
          SUM(
            CASE
              WHEN s.status = 'AVAILABLE' THEN 1
              WHEN s.status = 'LOCKED' AND s.lock_expires_at < NOW() THEN 1
              ELSE 0
            END
          ),
          0
        ) AS available_seats
      FROM stadium_stands ss
      JOIN events e
        ON e.id = ${matchId}
       AND ss.stadium_id = e.stadium_id
      LEFT JOIN stadium_rows sr
        ON sr.stand_id = ss.id
      LEFT JOIN stadium_seats stseat
        ON stseat.row_id = sr.id
      LEFT JOIN seats s
        ON s.event_id = e.id
       AND s.stadium_seat_id = stseat.id
      GROUP BY ss.id
    `;

    const countsByStandId = new Map<string, { totalSeats: number; availableSeats: number }>();
    for (const row of standCounts) {
      countsByStandId.set(row.stand_id, {
        totalSeats: toNumber(row.total_seats),
        availableSeats: toNumber(row.available_seats)
      });
    }

    const pricesByStandId = new Map<string, { minPrice: number; maxPrice: number }>();
    for (const tc of event.ticketCategories) {
      if (!tc.stadiumStandId) continue;
      const price = Number(tc.price);
      const existing = pricesByStandId.get(tc.stadiumStandId);
      if (!existing) {
        pricesByStandId.set(tc.stadiumStandId, { minPrice: price, maxPrice: price });
      } else {
        pricesByStandId.set(tc.stadiumStandId, {
          minPrice: Math.min(existing.minPrice, price),
          maxPrice: Math.max(existing.maxPrice, price)
        });
      }
    }

    const stands = event.stadium.stands.map((stand) => {
      const counts = countsByStandId.get(stand.id) || { totalSeats: 0, availableSeats: 0 };
      const pricing = pricesByStandId.get(stand.id) || null;

      const ratio = counts.totalSeats > 0 ? counts.availableSeats / counts.totalSeats : 0;
      const status =
        counts.totalSeats === 0 || counts.availableSeats === 0
          ? 'SOLD_OUT'
          : ratio <= 0.15
            ? 'FAST_FILLING'
            : 'AVAILABLE';

      return {
        id: stand.id,
        name: stand.name,
        code: stand.code,
        svgPath: stand.svgPath,
        minPrice: pricing ? pricing.minPrice : null,
        maxPrice: pricing ? pricing.maxPrice : null,
        availableSeats: counts.availableSeats,
        totalSeats: counts.totalSeats,
        status
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
        viewBox: event.stadium.svgViewBox || '0 0 500 400'
      },
      stands,
      lockDurationSeconds: DEFAULT_LOCK_SECONDS,
      serverTime: new Date().toISOString()
    });
  });

  /**
   * GET /api/v1/matches/:matchId/zones/:zoneId/seats
   * Returns seats only for the selected zone/stand (lazy loaded).
   */
  static getZoneSeats = asyncHandler(async (req: Request, res: Response) => {
    matchZoneParamSchema.parse({ params: req.params });

    const { matchId, zoneId } = req.params;
    const lockerId = getRequesterLockerId(req);

    // Release expired locks so UI doesn't show stale "LOCKED" seats.
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

    const event = await prisma.event.findUnique({
      where: { id: matchId },
      select: { id: true, stadiumId: true }
    });

    if (!event) {
      throw ApiError.notFound('Match not found', 'MATCH_NOT_FOUND');
    }
    if (!event.stadiumId) {
      throw ApiError.badRequest('Match has no stadium layout configured', 'MATCH_STADIUM_NOT_CONFIGURED');
    }

    const zone = await prisma.stadiumStand.findFirst({
      where: { id: zoneId, stadiumId: event.stadiumId },
      select: { id: true }
    });

    if (!zone) {
      throw ApiError.notFound('Zone not found for this match', 'ZONE_NOT_FOUND');
    }

    type ZoneSeatRow = {
      seat_id: string;
      stadium_seat_id: string;
      row_label: string;
      row_order: number;
      seat_number: number;
      seat_order: number;
      status: SeatStatus;
      locked_by: string | null;
      lock_expires_at: Date | null;
      price: any;
      x: number | null;
      y: number | null;
    };

    const rows = await prisma.$queryRaw<ZoneSeatRow[]>`
      SELECT
        s.id AS seat_id,
        ss.id AS stadium_seat_id,
        sr.label AS row_label,
        sr.sort_order AS row_order,
        ss.seat_number AS seat_number,
        ss.sort_order AS seat_order,
        s.status AS status,
        s.locked_by AS locked_by,
        s.lock_expires_at AS lock_expires_at,
        s.price AS price,
        ss.x AS x,
        ss.y AS y
      FROM stadium_rows sr
      JOIN stadium_seats ss
        ON ss.row_id = sr.id
      JOIN seats s
        ON s.stadium_seat_id = ss.id
       AND s.event_id = ${matchId}
      WHERE sr.stand_id = ${zoneId}
      ORDER BY sr.sort_order ASC, ss.sort_order ASC
    `;

    const now = Date.now();
    const seats = rows.map((row) => {
      let status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'SELECTED';
      let lockExpiresAt: string | null = row.lock_expires_at ? row.lock_expires_at.toISOString() : null;

      if (row.status === SeatStatus.LOCKED) {
        const expiresAtMs = row.lock_expires_at ? row.lock_expires_at.getTime() : 0;
        if (!row.lock_expires_at || expiresAtMs < now) {
          status = 'AVAILABLE';
          lockExpiresAt = null;
        } else if (lockerId && row.locked_by === lockerId) {
          status = 'SELECTED';
        } else {
          status = 'LOCKED';
        }
      } else if (row.status === SeatStatus.BOOKED || row.status === SeatStatus.SOLD) {
        status = 'BOOKED';
      } else if (row.status === SeatStatus.BLOCKED || row.status === SeatStatus.MAINTENANCE) {
        status = 'BOOKED';
      } else {
        status = 'AVAILABLE';
      }

      return {
        id: row.seat_id,
        stadiumSeatId: row.stadium_seat_id,
        seatNumber: String(row.seat_number),
        rowLabel: row.row_label,
        status,
        price: row.price !== null && row.price !== undefined ? Number(row.price) : 0,
        type: 'STANDARD',
        grid: {
          row: row.row_order,
          col: row.seat_order,
          ...(row.x !== null ? { x: row.x } : {}),
          ...(row.y !== null ? { y: row.y } : {})
        },
        ...(lockExpiresAt ? { lockExpiresAt } : {})
      };
    });

    return ApiResponse.success(res, 200, 'Zone seats fetched successfully', seats);
  });

  /**
   * POST /api/v1/matches/:matchId/seats/lock
   * Atomically locks seats for a short TTL to prevent double selection.
   */
  static lockSeats = asyncHandler(async (req: Request, res: Response) => {
    matchIdParamSchema.parse({ params: req.params });
    lockSeatsBodySchema.parse({ body: req.body });

    const { matchId } = req.params;
    const { seatIds, lockDurationSeconds = DEFAULT_LOCK_SECONDS, lockerId } = req.body as z.infer<typeof lockSeatsBodySchema>['body'];

    const locker = resolveLockerId(req, lockerId);
    const uniqueSeatIds = Array.from(new Set(seatIds));

    const now = new Date();
    const expiresAt = new Date(now.getTime() + lockDurationSeconds * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const existingActiveLocks = await tx.seat.count({
        where: {
          eventId: matchId,
          status: SeatStatus.LOCKED,
          lockedBy: locker,
          lockExpiresAt: { gt: now }
        }
      });

      const requested = await tx.seat.findMany({
        where: { eventId: matchId, id: { in: uniqueSeatIds } },
        select: { id: true, status: true, lockedBy: true, lockExpiresAt: true }
      });

      const alreadyLockedByMe = new Set(
        requested
          .filter((s) => s.status === SeatStatus.LOCKED && s.lockedBy === locker && s.lockExpiresAt && s.lockExpiresAt > now)
          .map((s) => s.id)
      );

      const seatsToNewlyLock = uniqueSeatIds.filter((id) => !alreadyLockedByMe.has(id));

      if (existingActiveLocks + seatsToNewlyLock.length > MAX_SEATS_PER_LOCKER) {
        throw ApiError.conflict('Seat limit exceeded', 'SEAT_LOCK_LIMIT_EXCEEDED', {
          maxSeatsPerUser: MAX_SEATS_PER_LOCKER
        });
      }

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
