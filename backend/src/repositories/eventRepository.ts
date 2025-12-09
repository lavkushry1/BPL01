import { Event, Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/apiError';

export type EventWithRelations = Prisma.EventGetPayload<{
  include: {
    organizer: {
      select: {
        id: true;
        name: true;
        email: true;
      }
    };
    categories: true;
    _count: {
      select: {
        bookings: true;
      }
    }
  }
}>;

export type EventCreateInput = Omit<
  Prisma.EventCreateInput,
  'organizer' | 'bookings' | 'categories'
> & {
  organizerId: string;
  categories?: string[];
};

export type EventUpdateInput = Omit<
  Prisma.EventUpdateInput,
  'organizer' | 'bookings' | 'categories'
> & {
  categories?: string[];
};

export type EventFilterOptions = {
  status?: string;
  search?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  organizerId?: string;
  page?: number;
  limit?: number;
};

export class EventRepository {
  /**
   * Find all events with filtering
   */
  async findAll(options: EventFilterOptions = {}): Promise<EventWithRelations[]> {
    const {
      status,
      search,
      category,
      startDate,
      endDate,
      organizerId,
      page = 1,
      limit = 10,
    } = options;

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Prisma.EventWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumEventStatusFilter;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categories = {
        some: {
          name: {
            equals: category,
            mode: 'insensitive',
          },
        },
      };
    }

    if (startDate) {
      where.startDate = {
        gte: startDate,
      };
    }

    if (endDate) {
      where.endDate = {
        lte: endDate,
      };
    }

    if (organizerId) {
      where.organizerId = organizerId;
    }

    return prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      skip,
      take: limit,
    });
  }

  /**
   * Find event by ID
   */
  async findById(id: string): Promise<EventWithRelations | null> {
    return prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });
  }

  /**
   * Create a new event
   */
  async create(data: EventCreateInput): Promise<Event> {
    const { categories = [], organizerId, ...eventData } = data;

    // Connect existing categories or create new ones
    const categoryConnections = await this.processCategoryConnections(categories);

    // Create the event with category connections
    return prisma.event.create({
      data: {
        ...eventData,
        organizer: {
          connect: { id: organizerId },
        },
        categories: {
          connect: categoryConnections,
        },
      },
    });
  }

  /**
   * Update an event
   */
  async update(id: string, data: EventUpdateInput): Promise<Event> {
    const { categories, ...eventData } = data;

    // Lookup event to ensure it exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: { categories: true },
    });

    if (!existingEvent) {
      throw new ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
    }

    // Update event data
    const updateData: Prisma.EventUpdateInput = {
      ...eventData,
    };

    // Process category updates if provided
    if (categories) {
      const categoryConnections = await this.processCategoryConnections(categories);

      // Disconnect all existing categories and connect the new ones
      updateData.categories = {
        set: [], // Disconnect all existing categories
        connect: categoryConnections,
      };
    }

    return prisma.event.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete an event
   */
  async delete(id: string): Promise<Event> {
    return prisma.event.delete({
      where: { id },
    });
  }

  /**
   * Count events
   */
  async count(options: EventFilterOptions = {}): Promise<number> {
    const {
      status,
      search,
      category,
      startDate,
      endDate,
      organizerId,
    } = options;

    // Build filter conditions (same as findAll)
    const where: Prisma.EventWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumEventStatusFilter;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categories = {
        some: {
          name: {
            equals: category,
            mode: 'insensitive',
          },
        },
      };
    }

    if (startDate) {
      where.startDate = {
        gte: startDate,
      };
    }

    if (endDate) {
      where.endDate = {
        lte: endDate,
      };
    }

    if (organizerId) {
      where.organizerId = organizerId;
    }

    return prisma.event.count({ where });
  }

  /**
   * Process category connections for create/update operations
   */
  private async processCategoryConnections(
    categories: string[]
  ): Promise<Prisma.CategoryWhereUniqueInput[]> {
    if (!categories.length) return [];

    const connections: Prisma.CategoryWhereUniqueInput[] = [];

    // Process each category
    for (const name of categories) {
      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { name },
      });

      if (existingCategory) {
        // Connect existing category
        connections.push({ id: existingCategory.id });
      } else {
        // Create and connect new category
        const newCategory = await prisma.category.create({
          data: { name },
        });
        connections.push({ id: newCategory.id });
      }
    }

    return connections;
  }
}
