import { NextFunction, Response } from 'express';
import { DatabaseRequest } from '../middleware/database';
import { ApiResponse } from '../utils/apiResponse';

export class DashboardController {
  /**
   * Get admin dashboard stats
   */
  static async getStats(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get user count
      const userCount = await req.db('users')
        .count('id as count')
        .first();

      // Get event count
      const eventCount = await req.db('events')
        .count('id as count')
        .first();

      // Get booking count
      const bookingCount = await req.db('bookings')
        .count('id as count')
        .first();

      // Get revenue
      const revenue = await req.db('payments')
        .where('status', 'verified')
        .sum('amount as total')
        .first();

      // Get recent bookings
      const recentBookings = await req.db('bookings')
        .select('id', 'user_id', 'event_id', 'status', 'total_amount', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(5);

      // Get active events
      const activeEvents = await req.db('events')
        .select('id', 'title', 'start_date', 'end_date', 'location', 'status')
        .where('status', 'published')
        .orderBy('start_date', 'asc')
        .limit(5);

      ApiResponse.success(res, 200, 'Dashboard stats retrieved successfully', {
        stats: {
          users: userCount ? Number(userCount.count) : 0,
          events: eventCount ? Number(eventCount.count) : 0,
          bookings: bookingCount ? Number(bookingCount.count) : 0,
          revenue: revenue ? Number(revenue.total) || 0 : 0
        },
        recentBookings,
        activeEvents
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sales stats
   */
  static async getSalesStats(req: DatabaseRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = 'week' } = req.query;

      let groupBy: string;
      let days: number;

      // Configure based on period
      switch (period) {
        case 'day':
          groupBy = 'hour';
          days = 1;
          break;
        case 'week':
          groupBy = 'day';
          days = 7;
          break;
        case 'month':
          groupBy = 'day';
          days = 30;
          break;
        case 'year':
          dateFormat = 'YYYY-MM';
          groupBy = 'month';
          days = 365;
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
          groupBy = 'day';
          days = 7;
      }

      // Get start date
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get sales data
      const sales = await req.db('payments')
        .select(
          req.db.raw(`DATE_TRUNC('${groupBy}', created_at) as date`),
          req.db.raw('SUM(amount) as revenue'),
          req.db.raw('COUNT(id) as count')
        )
        .where('status', 'verified')
        .where('created_at', '>=', startDate)
        .groupBy('date')
        .orderBy('date', 'asc');

      ApiResponse.success(res, 200, 'Sales stats retrieved successfully', {
        period,
        stats: sales.map(item => ({
          date: item.date,
          revenue: Number(item.revenue),
          count: Number(item.count)
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}
