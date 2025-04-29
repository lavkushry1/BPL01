"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.testConnection = testConnection;
const knex_1 = __importDefault(require("knex"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Initialize knex with our database configuration
exports.db = (0, knex_1.default)({
    client: 'pg',
    connection: {
        host: config_1.config.db.host,
        port: config_1.config.db.port,
        user: config_1.config.db.user,
        password: config_1.config.db.password,
        database: config_1.config.db.database,
        ssl: config_1.config.db.ssl ? { rejectUnauthorized: false } : false,
    },
    pool: {
        min: 2,
        max: config_1.config.db.max,
        idleTimeoutMillis: config_1.config.db.idleTimeoutMillis,
        acquireTimeoutMillis: 30000,
    },
    debug: !config_1.config.isProduction,
});
// Test the database connection
async function testConnection() {
    try {
        await exports.db.raw('SELECT 1+1 AS result');
        logger_1.logger.info('Database connection successful');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        return false;
    }
}
// Register connection handling events
exports.db.on('query', (query) => {
    if (!config_1.config.isProduction) {
        logger_1.logger.debug(`Query: ${query.sql}`, { bindings: query.bindings });
    }
});
exports.db.on('query-error', (error, query) => {
    logger_1.logger.error(`Query error: ${query.sql}`, {
        bindings: query.bindings,
        error
    });
});
exports.default = exports.db;
