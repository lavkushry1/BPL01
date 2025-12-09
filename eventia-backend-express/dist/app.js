"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const swagger_1 = require("./docs/swagger");
const csrf_1 = require("./middleware/csrf");
const dataloader_middleware_1 = require("./middleware/dataloader.middleware");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimit_1 = require("./middleware/rateLimit");
const job_service_1 = require("./services/job.service");
const websocket_service_1 = require("./services/websocket.service");
const apiError_1 = require("./utils/apiError");
const logger_1 = require("./utils/logger");
// Import route files
const routes_1 = __importDefault(require("./routes"));
const v1_1 = __importDefault(require("./routes/v1"));
const createApp = async () => {
    const app = (0, express_1.default)();
    const server = (0, http_1.createServer)(app);
    // Essential middleware - MOVED TO TOP
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
    // Debug middleware (now works since Winston console override is disabled for tests)
    if (process.env.NODE_ENV === 'test') {
        app.use((req, res, next) => {
            if (req.method === 'POST') {
                console.log('=== POST REQUEST DEBUG ===');
                console.log('Path:', req.path);
                console.log('Content-Type:', req.get('Content-Type'));
                console.log('Body:', req.body);
                console.log('==========================');
            }
            next();
        });
    }
    // Security headers using Helmet
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
                styleSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
                imgSrc: ["'self'", "data:", "https://api.qrserver.com"], // Allow QR code API
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'none'"],
                frameSrc: ["'none'"]
            }
        }
    }));
    // Compression middleware
    app.use((0, compression_1.default)());
    // Request logging with Morgan
    app.use((0, morgan_1.default)(config_1.config.nodeEnv === 'production' ? 'combined' : 'dev', {
        stream: {
            write: (message) => {
                logger_1.logger.http(message.trim());
            }
        },
        skip: (req) => {
            // Skip logging for health check endpoints to reduce noise
            return req.url.includes('/health');
        }
    }));
    // Essential middleware
    // express.json and urlencoded moved to top
    app.use((0, cookie_parser_1.default)());
    // Apply standard rate limiting to all routes
    app.use(rateLimit_1.standardLimiter);
    // Generate CSRF token for GET requests and validate for state-changing methods
    app.use((req, res, next) => {
        // Skip CSRF for tests
        if (process.env.NODE_ENV === 'test') {
            return next();
        }
        if (req.method === 'GET') {
            return (0, csrf_1.generateCsrfToken)(req, res, next);
        }
        return (0, csrf_1.validateCsrfToken)(req, res, next);
    });
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
    // Apply DataLoader middleware to optimize database queries
    app.use(dataloader_middleware_1.dataloaderMiddleware);
    logger_1.logger.info('DataLoader middleware initialized for optimized queries');
    // Setup API routes
    // Legacy route setup - keep for backward compatibility
    app.use('/api', routes_1.default);
    // Register v1 API routes
    app.use('/api/v1', v1_1.default);
    // Setup Swagger documentation
    (0, swagger_1.setupSwagger)(app);
    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            environment: config_1.config.nodeEnv,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || 'unknown'
        });
    });
    // Handle 404 routes
    app.use('*', (req, _res, next) => {
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
//# sourceMappingURL=app.js.map