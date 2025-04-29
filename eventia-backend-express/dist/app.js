"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_1 = require("./docs/swagger");
const apiError_1 = require("./utils/apiError");
function createApp() {
    const app = (0, express_1.default)();
    // Essential middleware
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    // Configure CORS to allow frontend access
    app.use((0, cors_1.default)({
        origin: [
            'http://localhost:8080', // Vite development server
            'http://localhost:5173', // Alternative Vite port
            'http://localhost:3000', // Just in case
            config_1.config.frontendUrl || '*' // From config if available
        ],
        credentials: true
    }));
    // Setup API routes
    app.use('/api', routes_1.default);
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
    // Error handling middleware (must be after routes)
    app.use(errorHandler_1.errorHandler);
    return app;
}
