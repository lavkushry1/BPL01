"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_1 = require("./docs/swagger");
const apiError_1 = require("./utils/apiError");
const logger_1 = require("./utils/logger");
const http_1 = require("http");
const websocket_service_1 = require("./services/websocket.service");
const job_service_1 = require("./services/job.service");
// Routes
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const event_routes_1 = __importDefault(require("./routes/event.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const discount_routes_1 = __importDefault(require("./routes/discount.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const createApp = async () => {
    const app = (0, express_1.default)();
    const server = (0, http_1.createServer)(app);
    // Essential middleware
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    // Configure CORS to allow frontend access
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081'];
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
                callback(null, true);
            }
            else {
                callback(new Error('CORS origin not allowed'), false);
            }
        },
        credentials: true
    }));
    // Setup API routes
    app.use('/api', routes_1.default);
    app.use('/api/v1/users', user_routes_1.default);
    app.use('/api/v1/events', event_routes_1.default);
    app.use('/api/v1/bookings', booking_routes_1.default);
    app.use('/api/v1/payments', payment_routes_1.default);
    app.use('/api/v1/discounts', discount_routes_1.default);
    app.use('/api/v1/health', health_routes_1.default);
    // Setup Swagger documentation
    (0, swagger_1.setupSwagger)(app);
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', environment: config_1.config.nodeEnv });
    });
    // Handle 404 routes
    app.use('*', (req, res, next) => {
        next(apiError_1.ApiError.notFound(`Cannot find ${req.originalUrl} on this server`));
    });
    // Initialize WebSocket service
    websocket_service_1.WebsocketService.initialize(server);
    logger_1.logger.info('WebSocket service initialized');
    // Schedule background jobs
    job_service_1.JobService.initialize();
    logger_1.logger.info('Background jobs initialized');
    // Error handling middleware (must be after routes)
    app.use(errorHandler_1.errorHandler);
    return { app, server };
};
exports.createApp = createApp;
