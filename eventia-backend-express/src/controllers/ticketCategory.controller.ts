import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import httpStatus from 'http-status';
import { ApiError } from '../utils/apiError';
import { catchAsync } from '../utils/catchAsync';

const prisma = new PrismaClient();

/**
 * Create a new ticket category
 */
const createTicketCategory = catchAsync(async (req: Request, res: Response) => {
  const { 
    name, 
    description, 
    price, 
    minimumPrice, 
    totalSeats,
    eventId 
  } = req.body;

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
      minimumPrice,
      totalSeats,
      bookedSeats: 0,
      eventId
    }
  });

  res.status(httpStatus.CREATED).json(ticketCategory);
});

/**
 * Get ticket categories for an event
 */
const getTicketCategoriesByEventId = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const ticketCategories = await prisma.ticketCategory.findMany({
    where: { eventId }
  });

  res.status(httpStatus.OK).json(ticketCategories);
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

  res.status(httpStatus.OK).json(ticketCategory);
});

/**
 * Update a ticket category
 */
const updateTicketCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    name, 
    description, 
    price, 
    minimumPrice, 
    totalSeats 
  } = req.body;

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
      minimumPrice,
      totalSeats
    }
  });

  res.status(httpStatus.OK).json(updatedTicketCategory);
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

  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Update booked seats count
 */
const updateBookedSeats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { bookedSeats } = req.body;

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

  res.status(httpStatus.OK).json(updatedTicketCategory);
});

export const TicketCategoryController = {
  createTicketCategory,
  getTicketCategoriesByEventId,
  getTicketCategoryById,
  updateTicketCategory,
  deleteTicketCategory,
  updateBookedSeats
};