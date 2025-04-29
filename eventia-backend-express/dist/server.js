"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const db_1 = require("./db");
const websocket_service_1 = require("./services/websocket.service");
const job_service_1 = require("./services/job.service");
async function startServer() {
    try {
        // Test database connection before starting server
        let dbConnected = false;
        try {
            // Skip DB check if we're in a special test mode
            if (process.env.SKIP_DB_CHECK === 'true') {
                logger_1.logger.warn('Skipping database connection check due to SKIP_DB_CHECK=true');
                dbConnected = true;
            }
            else {
                dbConnected = await (0, db_1.testConnection)();
            }
        }
        catch (error) {
            logger_1.logger.error('Database connection error:', error);
        }
        if (!dbConnected) {
            logger_1.logger.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }
        // Create Express app with HTTP server
        const { app, server } = await (0, app_1.createApp)();
        // Initialize Socket.IO
        const io = new socket_io_1.Server(server, {
            cors: {
                origin: config_1.config.frontendUrl || '*',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });
        // Initialize WebSocket service with the Socket.IO server
        websocket_service_1.WebsocketService.initialize(server);
        // Initialize background job service
        job_service_1.JobService.initialize();
        // Start server
        server.listen(config_1.config.port, () => {
            logger_1.logger.info(`Server running on port ${config_1.config.port} in ${config_1.config.nodeEnv} mode`);
            logger_1.logger.info(`API documentation available at http://localhost:${config_1.config.port}/api-docs`);
            logger_1.logger.info('WebSocket server initialized');
        });
        // Graceful shutdown
        const shutdown = async () => {
            logger_1.logger.info('Shutting down server...');
            // Stop all background jobs
            job_service_1.JobService.stopAllJobs();
            // Close server connections
            server.close(() => {
                logger_1.logger.info('HTTP server closed');
                process.exit(0);
            });
            // Force exit if graceful shutdown takes too long
            setTimeout(() => {
                logger_1.logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        // Handle graceful shutdown signals
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        // Handle unhandled rejections
        process.on('unhandledRejection', (err) => {
            logger_1.logger.error('UNHANDLED REJECTION:', err);
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.logger.error('Error starting server:', error);
        process.exit(1);
    }
}
// Start the server if this file is executed directly
if (require.main === module) {
    startServer();
}
exports.default = startServer;
