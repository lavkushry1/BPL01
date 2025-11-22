import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { catchAsync } from '../utils/catchAsync';
import { createTicketCategorySchema, updateTicketCategorySchema } from '../validations/ticketCategory.validation';

/**
 * Create a new ticket category
 */
const createTicketCategory = catchAsync(async (req: Request, res: Response) => {
  const validatedData = createTicketCategorySchema.parse(req.body);
  const {
    name,
    description,
    price,
    totalSeats,
    eventId
  } = validatedData;

  // Check if event exists
  const eventExists = await prisma.event.findUnique({
    where: { id: eventId }
  });

  if (!eventExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }

  const ticketCategory = await prisma.ticketCategory.create({
    data: {
      name,
      description,
      price,
      totalSeats,
      bookedSeats: 0,
      eventId
    }
  });

  return ApiResponse.created(res, ticketCategory, 'Ticket category created successfully');
});

/**
 * Get ticket categories for an event
 */
const getTicketCategoriesByEventId = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const ticketCategories = await prisma.ticketCategory.findMany({
    where: { eventId }
  });

  return ApiResponse.success(res, 200, 'Ticket categories fetched successfully', ticketCategories);
});

/**
 * Get a ticket category by ID
 */
const getTicketCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ticketCategory = await prisma.ticketCategory.findUnique({
    where: { id }
  });

  if (!ticketCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket category not found');
  }

  return ApiResponse.success(res, 200, 'Ticket category fetched successfully', ticketCategory);
});

/**
 * Update a ticket category
 */
const updateTicketCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTicketCategorySchema.parse(req.body);
  const {
    name,
    description,
    price,
    totalSeats
  } = validatedData;

  // Check if ticket category exists
  const ticketCategoryExists = await prisma.ticketCategory.findUnique({
    where: { id }
  });

  if (!ticketCategoryExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket category not found');
  }

  const updatedTicketCategory = await prisma.ticketCategory.update({
    where: { id },
    data: {
      name,
      description,
      price,
      totalSeats
    }
  });

  return ApiResponse.success(res, 200, 'Ticket category updated successfully', updatedTicketCategory);
});

/**
 * Delete a ticket category
 */
const deleteTicketCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if ticket category exists
  const ticketCategoryExists = await prisma.ticketCategory.findUnique({
    where: { id }
  });

  if (!ticketCategoryExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket category not found');
  }

  await prisma.ticketCategory.delete({
    where: { id }
  });

  return ApiResponse.success(res, 204, 'Ticket category deleted successfully');
});

/**
 * Update booked seats count
 */
const updateBookedSeats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { bookedSeats } = updateBookedSeatsSchema.parse(req.body);

  const ticketCategory = await prisma.ticketCategory.findUnique({
    where: { id }
  });

  if (!ticketCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket category not found');
  }

  if (bookedSeats > ticketCategory.totalSeats) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Booked seats cannot exceed total seats'
    );
  }

  const updatedTicketCategory = await prisma.ticketCategory.update({
    where: { id },
    data: { bookedSeats }
  });

  return ApiResponse.success(res, 200, 'Booked seats updated successfully', updatedTicketCategory);
});

export const TicketCategoryController = {
  createTicketCategory,
  getTicketCategoriesByEventId,
  getTicketCategoryById,
  updateTicketCategory,
  deleteTicketCategory,
  updateBookedSeats
};
