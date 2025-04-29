"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketCategoryController = void 0;
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const apiError_1 = require("../utils/apiError");
const catchAsync_1 = require("../utils/catchAsync");
const prisma = new client_1.PrismaClient();
/**
 * Create a new ticket category
 */
const createTicketCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, description, price, minimumPrice, totalSeats, eventId } = req.body;
    // Check if event exists
    const eventExists = await prisma.event.findUnique({
        where: { id: eventId }
    });
    if (!eventExists) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Event not found');
    }
    const ticketCategory = await prisma.ticketCategory.create({
        data: {
            name,
            description,
            price,
            minimumPrice,
            totalSeats,
            bookedSeats: 0,
            eventId
        }
    });
    res.status(http_status_1.default.CREATED).json(ticketCategory);
});
/**
 * Get ticket categories for an event
 */
const getTicketCategoriesByEventId = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { eventId } = req.params;
    const ticketCategories = await prisma.ticketCategory.findMany({
        where: { eventId }
    });
    res.status(http_status_1.default.OK).json(ticketCategories);
});
/**
 * Get a ticket category by ID
 */
const getTicketCategoryById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const ticketCategory = await prisma.ticketCategory.findUnique({
        where: { id }
    });
    if (!ticketCategory) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Ticket category not found');
    }
    res.status(http_status_1.default.OK).json(ticketCategory);
});
/**
 * Update a ticket category
 */
const updateTicketCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, minimumPrice, totalSeats } = req.body;
    // Check if ticket category exists
    const ticketCategoryExists = await prisma.ticketCategory.findUnique({
        where: { id }
    });
    if (!ticketCategoryExists) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Ticket category not found');
    }
    const updatedTicketCategory = await prisma.ticketCategory.update({
        where: { id },
        data: {
            name,
            description,
            price,
            minimumPrice,
            totalSeats
        }
    });
    res.status(http_status_1.default.OK).json(updatedTicketCategory);
});
/**
 * Delete a ticket category
 */
const deleteTicketCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    // Check if ticket category exists
    const ticketCategoryExists = await prisma.ticketCategory.findUnique({
        where: { id }
    });
    if (!ticketCategoryExists) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Ticket category not found');
    }
    await prisma.ticketCategory.delete({
        where: { id }
    });
    res.status(http_status_1.default.NO_CONTENT).send();
});
/**
 * Update booked seats count
 */
const updateBookedSeats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { bookedSeats } = req.body;
    const ticketCategory = await prisma.ticketCategory.findUnique({
        where: { id }
    });
    if (!ticketCategory) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Ticket category not found');
    }
    if (bookedSeats > ticketCategory.totalSeats) {
        throw new apiError_1.ApiError(http_status_1.default.BAD_REQUEST, 'Booked seats cannot exceed total seats');
    }
    const updatedTicketCategory = await prisma.ticketCategory.update({
        where: { id },
        data: { bookedSeats }
    });
    res.status(http_status_1.default.OK).json(updatedTicketCategory);
});
exports.TicketCategoryController = {
    createTicketCategory,
    getTicketCategoriesByEventId,
    getTicketCategoryById,
    updateTicketCategory,
    deleteTicketCategory,
    updateBookedSeats
};
