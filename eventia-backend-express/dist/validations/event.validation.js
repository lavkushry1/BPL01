"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEventSchema = exports.createEventSchema = void 0;
const joi_1 = __importDefault(require("joi"));
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
