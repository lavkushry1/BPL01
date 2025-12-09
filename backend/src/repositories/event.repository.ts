import { Event, EventStatus, Prisma } from '@prisma/client';
import { EventFilters, PaginationResult } from '../types/event.types';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

/**
 * Repository for Event data access operations
 */
export class EventRepository {
  private prisma: any; // Use 'any' type to accommodate extended Prisma client

  // Define safe fields that exist in the database (excluding is_deleted)
  private safeFields: Record<string, boolean> = {
    id: true,
    title: true,
    description: true,
    startDate: true,
    endDate: true,
    location: true,
    status: true,
    capacity: true,
    imageUrl: true,
    organizerId: true,
    deletedAt: true,
    createdBy: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true
  };

  constructor(prisma: any) { // Accept any type of Prisma client
    this.prisma = prisma;
  }

  /**
   * Find many events with filtering and pagination
   * Supports both offset-based and cursor-based pagination
   */
  async findMany(filters: EventFilters): Promise<{
    events: Event[];
    pagination: PaginationResult;
  }> {
    try {
      const where = this.buildWhereClause(filters);

      // Build include object to handle relations
      const includeObject = this.buildIncludeObject(filters.include);

      // Determine sort field and direction
      const sortField = this.mapSortField(filters.sortBy || 'createdAt');
      const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
      const orderBy: Record<string, 'asc' | 'desc'> = { [sortField]: sortOrder };

      // Use safe select to avoid the is_deleted field
      const select = { ...this.safeFields };
      if (Object.keys(includeObject).length > 0) {
        Object.assign(select, includeObject);
      }

      const queryOptions: any = {
        where,
        select,
        orderBy
      };

      // Handle cursor-based pagination if cursor is provided
      if (filters.cursor) {
        queryOptions.take = filters.limit || 10;
        queryOptions.skip = 1; // Skip the cursor
        queryOptions.cursor = {
          id: filters.cursor
        };
      }
      // Otherwise use offset-based pagination
      else if (filters.page && filters.limit) {
        queryOptions.skip = (filters.page - 1) * filters.limit;
        queryOptions.take = filters.limit;
      }

      // Execute the query with our safe selection
      const events = await this.prisma.event.findMany(queryOptions);

      // Get total count for pagination (only needed for offset pagination)
      const total = filters.cursor
        ? undefined // For cursor pagination, we don't need total count
        : await this.prisma.event.count({ where });

      // Prepare pagination metadata
      let pagination: PaginationResult;

      if (filters.cursor) {
        // Cursor-based pagination metadata
        pagination = {
          nextCursor: events.length === (filters.limit || 10) ? events[events.length - 1].id : null,
          limit: filters.limit || 10,
          hasMore: events.length === (filters.limit || 10)
        };
      } else {
        // Offset-based pagination metadata
        pagination = {
          total: total!,
          page: filters.page || 1,
          limit: filters.limit || events.length,
          totalPages: filters.limit && total ? Math.ceil(total / filters.limit) : 1
        };
      }

      return {
        events: events as unknown as Event[], // Cast to our domain model
        pagination
      };
    } catch (error) {
      logger.error('Error in EventRepository.findMany:', error);
      throw this.mapPrismaError(error as Error);
    }
  }

  /**
   * Find multiple events by their IDs (batched query)
   */
  async findByIds(ids: string[], include?: string[]): Promise<Event[]> {
    try {
      const includeObject = this.buildIncludeObject(include);

      const select = { ...this.safeFields };
      if (Object.keys(includeObject).length > 0) {
        Object.assign(select, includeObject);
      }

      const events = await this.prisma.event.findMany({
        where: {
          id: { in: ids }
        },
        select
      });

      return events as unknown as Event[];
    } catch (error) {
      logger.error(`Error in EventRepository.findByIds:`, error);
      throw this.mapPrismaError(error as Error);
    }
  }

  /**
   * Find a single event by ID
   */
  async findById(id: string, include?: string[]): Promise<Event | null> {
    try {
      const includeObject = this.buildIncludeObject(include);

      const select = { ...this.safeFields };
      if (Object.keys(includeObject).length > 0) {
        Object.assign(select, includeObject);
      }

      const event = await this.prisma.event.findUnique({
        where: { id },
        select
      });

      return event as unknown as Event; // Cast to our domain model
    } catch (error) {
      logger.error(`Error in EventRepository.findById for id ${id}:`, error);
      throw this.mapPrismaError(error as Error);
    }
  }

  /**
   * Create a new event
   */
  async create(data: Prisma.EventCreateInput, include?: string[]): Promise<Event> {
    try {
      const includeObject = this.buildIncludeObject(include);

      // Remove isDeleted from data if it exists to avoid Prisma errors
      const safeData = { ...data };
      // @ts-expect-error
      if (safeData.isDeleted !== undefined) {
        // @ts-expect-error
        delete safeData.isDeleted;
      }

      const select = { ...this.safeFields };
      if (Object.keys(includeObject).length > 0) {
        Object.assign(select, includeObject);
      }

      const event = await this.prisma.event.create({
        data: safeData,
        select
      });

      return event as unknown as Event; // Cast to our domain model
    } catch (error) {
      logger.error('Error in EventRepository.create:', error);
      throw this.mapPrismaError(error as Error);
    }
  }

  /**
   * Update an existing event
   */
  async update(id: string, data: Prisma.EventUpdateInput, include?: string[]): Promise<Event> {
    try {
      const includeObject = this.buildIncludeObject(include);

      // Remove isDeleted from data if it exists to avoid Prisma errors
      const safeData = { ...data };
      // @ts-expect-error
      if (safeData.isDeleted !== undefined) {
        // @ts-expect-error
        delete safeData.isDeleted;
      }

      const select = { ...this.safeFields };
      if (Object.keys(includeObject).length > 0) {
        Object.assign(select, includeObject);
      }

      const event = await this.prisma.event.update({
        where: { id },
        data: safeData,
        select
      });

      return event as unknown as Event; // Cast to our domain model
    } catch (error) {
      logger.error(`Error in EventRepository.update for id ${id}:`, error);
      throw this.mapPrismaError(error as Error);
    }
  }

  /**
   * Delete an event (soft delete)
   */
  async delete(id: string, include?: string[]): Promise<Event> {
    try {
      const includeObject = this.buildIncludeObject(include);

      const select = { ...this.safeFields };
      if (Object.keys(includeObject).length > 0) {
        Object.assign(select, includeObject);
      }

      const event = await this.prisma.event.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          status: EventStatus.CANCELLED
        },
        select
      });

      return event as unknown as Event; // Cast to our domain model
    } catch (error) {
      logger.error(`Error in EventRepository.delete for id ${id}:`, error);
      throw this.mapPrismaError(error as Error);
    }
  }

  /**
   * Count events based on filter
   */
  async count(filters: EventFilters): Promise<number> {
    try {
      const where = this.buildWhereClause(filters);
      return await this.prisma.event.count({ where });
    } catch (error) {
      logger.error('Error in EventRepository.count:', error);
      throw this.mapPrismaError(error as Error);
    }
  }

  /**
   * Convert include string array to Prisma include object
   */
  private buildIncludeObject(include?: string[]): Record<string, boolean> {
    const includeObject: Record<string, boolean> = {};

    if (!include || include.length === 0) {
      return includeObject;
    }

    // Map relation names to their Prisma model names
    if (include.includes('ticketCategories')) includeObject.ticketCategories = true;
    if (include.includes('categories')) includeObject.categories = true;
    if (include.includes('organizer')) includeObject.organizer = true;
    if (include.includes('seats')) includeObject.seats = true;
    if (include.includes('discounts')) includeObject.discounts = true;
    if (include.includes('bookings')) includeObject.bookings = true;

    return includeObject;
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(filters: EventFilters): Prisma.EventWhereInput {
    const where: Prisma.EventWhereInput = {};

    // Category filter
    if (filters.category) {
      where.categories = {
        some: {
          name: {
            equals: filters.category,
            mode: 'insensitive'
          }
        }
      };
    }

    // Date filter
    if (filters.date) {
      const dateObj = new Date(filters.date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);

      where.startDate = {
        gte: dateObj,
        lt: nextDay
      };
    }

    // Date range filter
    if (filters.startDate) {
      where.startDate = { gte: new Date(filters.startDate) };
    }

    if (filters.endDate) {
      where.endDate = where.endDate || {};
      Object.assign(where.endDate, { lte: new Date(filters.endDate) });
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Organizer filter
    if (filters.organizerId) {
      where.organizerId = filters.organizerId;
    }

    // Filter by multiple IDs if provided
    if (filters.ids && filters.ids.length > 0) {
      where.id = { in: filters.ids };
    }

    // isDeleted filter is completely removed since the column doesn't exist
    // We'll use deletedAt instead if soft delete is needed later

    return where;
  }

  /**
   * Map sort field name to database field
   */
  private mapSortField(sortField: string): string {
    const fieldMap: Record<string, string> = {
      'created_at': 'createdAt',
      'updated_at': 'updatedAt',
      'start_date': 'startDate',
      'end_date': 'endDate',
    };

    return fieldMap[sortField] || sortField;
  }

  /**
   * Map Prisma errors to domain errors
   */
  private mapPrismaError(error: Error): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return ApiError.notFound('Event not found');
        case 'P2002':
          return ApiError.conflict('Event with this identifier already exists');
        case 'P2003':
          return ApiError.badRequest('Invalid reference to a related resource');
        default:
          return ApiError.internal(`Database error: ${error.code}`);
      }
    }
    return error;
  }
}

// Create and export singleton instance
import prisma from '../db/prisma';
export const eventRepository = new EventRepository(prisma);
