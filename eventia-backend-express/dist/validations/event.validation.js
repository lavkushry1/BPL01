"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEventSchema = exports.createEventSchema = exports.validateEventInput = void 0;
const joi_1 = __importDefault(require("joi"));
// Event image validation schema
const eventImageSchema = joi_1.default.object({
    url: joi_1.default.string().required(),
    alt_text: joi_1.default.string().allow(null, ''),
    is_featured: joi_1.default.boolean().default(false)
});
// Ticket type validation schema
const ticketTypeSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    description: joi_1.default.string().allow(null, ''),
    price: joi_1.default.number().min(0).required(),
    quantity: joi_1.default.number().integer().min(0).required(),
    available: joi_1.default.number().integer().min(0)
});
// Team validation schema
const teamSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    shortName: joi_1.default.string().max(5),
    logo: joi_1.default.string().uri().allow(null, '')
});
// Event input validation schema
const eventSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    description: joi_1.default.string().required(),
    start_date: joi_1.default.date().iso().required(),
    end_date: joi_1.default.date().iso().min(joi_1.default.ref('start_date')).allow(null),
    location: joi_1.default.string().required(),
    status: joi_1.default.string().valid('draft', 'published', 'cancelled').default('draft'),
    category: joi_1.default.string().required(),
    featured: joi_1.default.boolean().default(false),
    // Optional IPL match specific fields
    posterImage: joi_1.default.string().uri().allow(null, ''),
    venue: joi_1.default.string(),
    time: joi_1.default.string(),
    duration: joi_1.default.string(),
    // Nested objects
    images: joi_1.default.array().items(eventImageSchema),
    ticket_types: joi_1.default.array().items(ticketTypeSchema),
    teams: joi_1.default.object({
        team1: teamSchema,
        team2: teamSchema
    }).allow(null)
});
/**
 * Validates event input data
 * @param data The event data to validate
 * @param isUpdate Whether this is an update (making fields optional)
 * @returns Validation result with error and value
 */
const validateEventInput = (data, isUpdate = false) => {
    const schema = isUpdate
        ? eventSchema.fork(['title', 'description', 'start_date', 'location', 'category'], (schema) => schema.optional())
        : eventSchema;
    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: true
    });
};
exports.validateEventInput = validateEventInput;
exports.createEventSchema = joi_1.default.object({
    title: joi_1.default.string().required().max(255),
    description: joi_1.default.string().allow('').max(2000),
    start_date: joi_1.default.date().iso().required(),
    end_date: joi_1.default.date().iso().min(joi_1.default.ref('start_date')),
    venue_id: joi_1.default.string().uuid().required(),
    category: joi_1.default.string().max(50),
    has_seat_map: joi_1.default.boolean().default(false),
    seat_map_id: joi_1.default.string().uuid().allow(null),
    ticket_types: joi_1.default.array().items(joi_1.default.object({
        name: joi_1.default.string().required().max(100),
        description: joi_1.default.string().allow('').max(500),
        price: joi_1.default.number().required().min(0),
        quantity: joi_1.default.number().integer().required().min(1)
    })),
    images: joi_1.default.array().items(joi_1.default.object({
        url: joi_1.default.string().required().uri(),
        alt_text: joi_1.default.string().allow('').max(255),
        is_featured: joi_1.default.boolean()
    }))
});
exports.updateEventSchema = joi_1.default.object({
    title: joi_1.default.string().max(255),
    description: joi_1.default.string().allow('').max(2000),
    start_date: joi_1.default.date().iso(),
    end_date: joi_1.default.date().iso().min(joi_1.default.ref('start_date')),
    venue_id: joi_1.default.string().uuid(),
    category: joi_1.default.string().max(50),
    has_seat_map: joi_1.default.boolean(),
    seat_map_id: joi_1.default.string().uuid().allow(null),
    ticket_types: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().uuid(),
        name: joi_1.default.string().max(100),
        description: joi_1.default.string().allow('').max(500),
        price: joi_1.default.number().min(0),
        quantity: joi_1.default.number().integer().min(1)
    })),
    images: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().uuid(),
        url: joi_1.default.string().uri(),
        alt_text: joi_1.default.string().allow('').max(255),
        is_featured: joi_1.default.boolean()
    }))
});
