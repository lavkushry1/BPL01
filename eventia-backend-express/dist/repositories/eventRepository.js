"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRepository = void 0;
const prisma_1 = __importDefault(require("../db/prisma"));
const apiError_1 = require("../utils/apiError");
class EventRepository {
    /**
     * Find all events with filtering
     */
    async findAll(options = {}) {
        const { status, search, category, startDate, endDate, organizerId, page = 1, limit = 10, } = options;
        const skip = (page - 1) * limit;
        // Build filter conditions
        const where = {};
        if (status) {
            where.status = status;
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
        return prisma_1.default.event.findMany({
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
    async findById(id) {
        return prisma_1.default.event.findUnique({
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
    async create(data) {
        const { categories = [], organizerId, ...eventData } = data;
        // Connect existing categories or create new ones
        const categoryConnections = await this.processCategoryConnections(categories);
        // Create the event with category connections
        return prisma_1.default.event.create({
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
    async update(id, data) {
        const { categories, ...eventData } = data;
        // Lookup event to ensure it exists
        const existingEvent = await prisma_1.default.event.findUnique({
            where: { id },
            include: { categories: true },
        });
        if (!existingEvent) {
            throw new apiError_1.ApiError(404, 'Event not found', 'EVENT_NOT_FOUND');
        }
        // Update event data
        const updateData = {
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
        return prisma_1.default.event.update({
            where: { id },
            data: updateData,
        });
    }
    /**
     * Delete an event
     */
    async delete(id) {
        return prisma_1.default.event.delete({
            where: { id },
        });
    }
    /**
     * Count events
     */
    async count(options = {}) {
        const { status, search, category, startDate, endDate, organizerId, } = options;
        // Build filter conditions (same as findAll)
        const where = {};
        if (status) {
            where.status = status;
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
        return prisma_1.default.event.count({ where });
    }
    /**
     * Process category connections for create/update operations
     */
    async processCategoryConnections(categories) {
        if (!categories.length)
            return [];
        const connections = [];
        // Process each category
        for (const name of categories) {
            // Check if category exists
            const existingCategory = await prisma_1.default.category.findUnique({
                where: { name },
            });
            if (existingCategory) {
                // Connect existing category
                connections.push({ id: existingCategory.id });
            }
            else {
                // Create and connect new category
                const newCategory = await prisma_1.default.category.create({
                    data: { name },
                });
                connections.push({ id: newCategory.id });
            }
        }
        return connections;
    }
}
exports.EventRepository = EventRepository;
