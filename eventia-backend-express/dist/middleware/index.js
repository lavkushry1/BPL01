"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMiddleware = setupMiddleware;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
function setupMiddleware(app) {
    // Security Headers
    app.use((0, helmet_1.default)());
    // CORS configuration
    app.use((0, cors_1.default)(config_1.config.cors));
    // JSON body parser
    app.use(express_1.default.json({ limit: '10mb' }));
    // URL encoded body parser
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Compression middleware
    app.use((0, compression_1.default)());
    // Request logging
    app.use((0, morgan_1.default)(config_1.config.isProduction ? 'combined' : 'dev', {
        stream: logger_1.stream,
    }));
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: config_1.config.rateLimit.windowMs,
        max: config_1.config.rateLimit.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many requests from this IP, please try again later',
    });
    // Apply rate limiting to all requests
    app.use(limiter);
    // Serve static files if needed
    app.use(express_1.default.static('public', {
        maxAge: config_1.config.static.maxAge,
    }));
}
