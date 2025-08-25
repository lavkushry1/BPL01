"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.checkDatabaseHealth = exports.initializeDatabase = exports.db = void 0;
const knex_1 = __importDefault(require("knex"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Configuration for database connection
const dbConfig = {
    client: 'pg',
    connection: {
        host: config_1.config.db.host,
        port: config_1.config.db.port,
        user: config_1.config.db.user,
        password: config_1.config.db.password,
        database: config_1.config.db.database,
        ssl: config_1.config.db.ssl ? { rejectUnauthorized: false } : false
    },
    pool: {
        min: 2,
        max: 10,
        // How long a client is allowed to remain idle before being closed
        idleTimeoutMillis: 30000,
        // How long to wait for a connection to be acquired
        acquireTimeoutMillis: 60000,
        // How long to wait for queries to complete
        createTimeoutMillis: 30000,
        // How often to check for idle clients
        reapIntervalMillis: 1000,
        // How long to wait for a client to be destroyed
        destroyTimeoutMillis: 5000,
        // Propagate errors from the database driver
        propagateCreateError: false,
    },
    acquireConnectionTimeout: 60000,
    // Debug mode for development
    debug: config_1.config.nodeEnv === 'development',
    // Disable debug in tests and production
    log: {
        warn: (msg) => logger_1.logger.warn(msg),
        error: (msg) => logger_1.logger.error(msg),
        debug: (msg) => {
            if (config_1.config.nodeEnv === 'development') {
                logger_1.logger.debug(msg);
            }
        }
    }
};
// Create the knex instance
exports.db = (0, knex_1.default)(dbConfig);
// Max retry attempts
const MAX_RETRIES = 5;
// Initial retry delay in ms
const INITIAL_RETRY_DELAY = 1000;
/**
 * Initialize the database connection with retry logic
 */
const initializeDatabase = async () => {
    let retries = 0;
    let connected = false;
    while (!connected && retries < MAX_RETRIES) {
        try {
            logger_1.logger.info('Attempting to connect to database...');
            // Test the connection
            await exports.db.raw('SELECT 1');
            connected = true;
            logger_1.logger.info('Successfully connected to database');
        }
        catch (error) {
            retries++;
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries - 1);
            // Handle error correctly by checking if it's an Error object
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Failed to connect to database (attempt ${retries}/${MAX_RETRIES}): ${errorMessage}`);
            logger_1.logger.info(`Retrying in ${delay}ms...`);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    if (!connected) {
        logger_1.logger.error(`Failed to connect to database after ${MAX_RETRIES} attempts`);
        // This will trigger process exit in the server.ts file
        throw new Error('Unable to establish database connection');
    }
};
exports.initializeDatabase = initializeDatabase;
/**
 * Check database connection health
 * @returns {Promise<boolean>} True if connection is healthy
 */
const checkDatabaseHealth = async () => {
    try {
        // Test a simple query to check connection
        await exports.db.raw('SELECT 1');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
/**
 * Gracefully close the database connection
 */
const closeDatabase = async () => {
    try {
        logger_1.logger.info('Closing database connection...');
        await exports.db.destroy();
        logger_1.logger.info('Database connection closed successfully');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection:', error);
        throw error;
    }
};
exports.closeDatabase = closeDatabase;
exports.default = exports.db;
//# sourceMappingURL=index.js.map