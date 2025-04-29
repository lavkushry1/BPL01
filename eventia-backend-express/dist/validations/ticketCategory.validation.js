"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getByEventIdSchema = exports.getByIdSchema = exports.updateBookedSeatsSchema = exports.updateTicketCategorySchema = exports.createTicketCategorySchema = void 0;
const zod_1 = require("zod");
const custom_validation_1 = require("./custom.validation");
exports.createTicketCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().positive('Price must be positive'),
        minimumPrice: zod_1.z.number().positive('Minimum price must be positive').optional(),
        totalSeats: zod_1.z.number().int().positive('Total seats must be positive'),
        eventId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val), 'Invalid event ID')
    })
});
exports.updateTicketCategorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val), 'Invalid ticket category ID')
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required').optional(),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().positive('Price must be positive').optional(),
        minimumPrice: zod_1.z.number().positive('Minimum price must be positive').optional(),
        totalSeats: zod_1.z.number().int().positive('Total seats must be positive').optional()
    })
});
exports.updateBookedSeatsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val), 'Invalid ticket category ID')
    }),
    body: zod_1.z.object({
        bookedSeats: zod_1.z.number().int().nonnegative('Booked seats cannot be negative')
    })
});
exports.getByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val), 'Invalid ticket category ID')
    })
});
exports.getByEventIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        eventId: zod_1.z.string().refine(val => (0, custom_validation_1.objectId)(val), 'Invalid event ID')
    })
});
const ticketCategoryValidation = {
    createTicketCategory: exports.createTicketCategorySchema,
    updateTicketCategory: exports.updateTicketCategorySchema,
    updateBookedSeats: exports.updateBookedSeatsSchema,
    getById: exports.getByIdSchema,
    getByEventId: exports.getByEventIdSchema
};
exports.default = ticketCategoryValidation;
