"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketCategoryController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = require("../db/prisma");
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const catchAsync_1 = require("../utils/catchAsync");
const ticketCategory_validation_1 = require("../validations/ticketCategory.validation");
/**
 * Create a new ticket category
 */
const createTicketCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { body: { name, description, price, totalSeats, eventId, minimumPrice } } = ticketCategory_validation_1.createTicketCategorySchema.parse({ body: req.body });
    // Check if event exists
    const eventExists = await prisma_1.prisma.event.findUnique({
        where: { id: eventId }
    });
    if (!eventExists) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Event not found');
    }
    const ticketCategory = await prisma_1.prisma.ticketCategory.create({
        data: {
            name,
            description,
            price,
            totalSeats,
            bookedSeats: 0,
            eventId
        }
    });
    return apiResponse_1.ApiResponse.created(res, ticketCategory, 'Ticket category created successfully');
});
/**
 * Get ticket categories for an event
 */
const getTicketCategoriesByEventId = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { eventId } = req.params;
    const ticketCategories = await prisma_1.prisma.ticketCategory.findMany({
        where: { eventId }
    });
    return apiResponse_1.ApiResponse.success(res, 200, 'Ticket categories fetched successfully', ticketCategories);
});
/**
 * Get a ticket category by ID
 */
const getTicketCategoryById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const ticketCategory = await prisma_1.prisma.ticketCategory.findUnique({
        where: { id }
    });
    if (!ticketCategory) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Ticket category not found');
    }
    return apiResponse_1.ApiResponse.success(res, 200, 'Ticket category fetched successfully', ticketCategory);
});
/**
 * Update a ticket category
 */
const updateTicketCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { body: { name, description, price, totalSeats } } = ticketCategory_validation_1.updateTicketCategorySchema.parse({ params: req.params, body: req.body });
    // Check if ticket category exists
    const ticketCategoryExists = await prisma_1.prisma.ticketCategory.findUnique({
        where: { id }
    });
    if (!ticketCategoryExists) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Ticket category not found');
    }
    const updatedTicketCategory = await prisma_1.prisma.ticketCategory.update({
        where: { id },
        data: {
            name,
            description,
            price,
            totalSeats
        }
    });
    return apiResponse_1.ApiResponse.success(res, 200, 'Ticket category updated successfully', updatedTicketCategory);
});
/**
 * Delete a ticket category
 */
const deleteTicketCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    // Check if ticket category exists
    const ticketCategoryExists = await prisma_1.prisma.ticketCategory.findUnique({
        where: { id }
    });
    if (!ticketCategoryExists) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Ticket category not found');
    }
    await prisma_1.prisma.ticketCategory.delete({
        where: { id }
    });
    return apiResponse_1.ApiResponse.success(res, 204, 'Ticket category deleted successfully');
});
/**
 * Update booked seats count
 */
const updateBookedSeats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { body: { bookedSeats } } = ticketCategory_validation_1.updateBookedSeatsSchema.parse({ params: req.params, body: req.body });
    const ticketCategory = await prisma_1.prisma.ticketCategory.findUnique({
        where: { id }
    });
    if (!ticketCategory) {
        throw new apiError_1.ApiError(http_status_1.default.NOT_FOUND, 'Ticket category not found');
    }
    if (bookedSeats > ticketCategory.totalSeats) {
        throw new apiError_1.ApiError(http_status_1.default.BAD_REQUEST, 'Booked seats cannot exceed total seats');
    }
    const updatedTicketCategory = await prisma_1.prisma.ticketCategory.update({
        where: { id },
        data: { bookedSeats }
    });
    return apiResponse_1.ApiResponse.success(res, 200, 'Booked seats updated successfully', updatedTicketCategory);
});
exports.TicketCategoryController = {
    createTicketCategory,
    getTicketCategoriesByEventId,
    getTicketCategoryById,
    updateTicketCategory,
    deleteTicketCategory,
    updateBookedSeats
};
//# sourceMappingURL=ticketCategory.controller.js.map