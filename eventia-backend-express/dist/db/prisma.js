"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectPrisma = exports.connectPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
// Create a base Prisma client for event listening
const basePrisma = new client_1.PrismaClient({
    log: [
        { level: 'error', emit: 'event' },
        { level: 'query', emit: config_1.config.isDevelopment ? 'event' : 'stdout' },
    ],
});
// Setup event handlers if in development
if (config_1.config.isDevelopment) {
    // TypeScript needs explicit type assertion for these event types
    basePrisma.$on('query', (e) => {
        logger_1.logger.debug(`Query: ${e.query}`, {
            params: e.params,
            duration: e.duration
        });
    });
    basePrisma.$on('error', (e) => {
        logger_1.logger.error('Prisma error:', e);
    });
}
// Now extend the base client with our middleware
exports.prisma = basePrisma.$extends({
    name: 'missingColumnWorkaround',
    query: {
        $allModels: {
            async $allOperations({ args, query, operation, model }) {
                // Fields known to be missing from the database but present in schema
                const missingFields = {
                    Event: ['isDeleted'],
                    User: ['isDeleted'],
                    Booking: ['isDeleted'],
                    Payment: ['isDeleted'],
                    TicketCategory: ['isDeleted'],
                    Discount: ['isDeleted'],
                    Seat: ['isDeleted'],
                    Ticket: ['isDeleted']
                };
                try {
                    // Log detailed information in debug mode
                    if (config_1.config.isDevelopment) {
                        logger_1.logger.debug(`Prisma operation: ${operation} on model ${model}`, {
                            operation,
                            model,
                            argsSnapshot: JSON.stringify(args).substring(0, 500)
                        });
                    }
                    // Type safety: cast args to any to handle property access
                    const typedArgs = args;
                    // Handle missing fields in the database for findMany, findUnique, findFirst operations
                    if (['findMany', 'findUnique', 'findFirst'].includes(operation)) {
                        if (model in missingFields && typedArgs.select === undefined && typedArgs.include === undefined) {
                            // If no specific fields are requested and the model has missing fields,
                            // add a select object that excludes those fields
                            const modelFields = Object.keys(basePrisma[model.toLowerCase()]?.fields || {});
                            const selectFields = {};
                            for (const field of modelFields) {
                                if (!missingFields[model]?.includes(field)) {
                                    selectFields[field] = true;
                                }
                            }
                            typedArgs.select = selectFields;
                        }
                    }
                    // Remove isDeleted from any where clause for all models
                    if (model in missingFields && typedArgs.where) {
                        // For all models with missing fields
                        for (const field of missingFields[model]) {
                            if (field in typedArgs.where) {
                                logger_1.logger.debug(`Removing ${field} from where clause for ${model}`);
                                delete typedArgs.where[field];
                            }
                        }
                        // Also handle nested where conditions (OR, AND, etc)
                        if (typedArgs.where.OR) {
                            typedArgs.where.OR = typedArgs.where.OR.map((condition) => {
                                const cleanedCondition = { ...condition };
                                for (const field of missingFields[model]) {
                                    if (field in cleanedCondition) {
                                        delete cleanedCondition[field];
                                    }
                                }
                                return cleanedCondition;
                            }).filter((c) => Object.keys(c).length > 0); // Remove empty conditions
                            // If OR becomes empty, remove it
                            if (typedArgs.where.OR.length === 0) {
                                delete typedArgs.where.OR;
                            }
                        }
                        if (typedArgs.where.AND) {
                            typedArgs.where.AND = typedArgs.where.AND.map((condition) => {
                                const cleanedCondition = { ...condition };
                                for (const field of missingFields[model]) {
                                    if (field in cleanedCondition) {
                                        delete cleanedCondition[field];
                                    }
                                }
                                return cleanedCondition;
                            }).filter((c) => Object.keys(c).length > 0); // Remove empty conditions
                            // If AND becomes empty, remove it
                            if (typedArgs.where.AND.length === 0) {
                                delete typedArgs.where.AND;
                            }
                        }
                    }
                    return await query(args);
                }
                catch (error) {
                    // If the error is about a missing column, log it and retry without the problematic field
                    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
                        logger_1.logger.warn(`Column missing in database but present in schema: ${error.message}`);
                        // Try to parse the missing column name from the error message
                        const missingColumnMatch = error.message.match(/The column `([^`]+)` does not exist/);
                        if (missingColumnMatch && missingColumnMatch[1]) {
                            const missingColumn = missingColumnMatch[1];
                            logger_1.logger.warn(`Detected missing column: ${missingColumn}, retrying query without it`);
                            // Type safety: cast args to any to handle property access
                            const typedArgs = args;
                            // Extract table and column from the error (e.g., "events.is_deleted" → "events" and "is_deleted")
                            const [table, column] = missingColumn.split('.');
                            // Extract the field name from the column name (remove table prefix and convert to camelCase)
                            const fieldName = column.includes('_')
                                ? column.split('_').map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('')
                                : column;
                            logger_1.logger.debug(`Field name derived from column: "${fieldName}" for column "${column}"`);
                            // Remove the field from all possible locations in the query
                            if (typedArgs.select && fieldName in typedArgs.select) {
                                delete typedArgs.select[fieldName];
                            }
                            if (typedArgs.where && fieldName in typedArgs.where) {
                                delete typedArgs.where[fieldName];
                            }
                            if (typedArgs.data && fieldName in typedArgs.data) {
                                delete typedArgs.data[fieldName];
                            }
                            // Handle orderBy
                            if (typedArgs.orderBy) {
                                if (Array.isArray(typedArgs.orderBy)) {
                                    typedArgs.orderBy = typedArgs.orderBy.filter((item) => {
                                        return typeof item === 'object' ? !(fieldName in item) : item !== fieldName;
                                    });
                                }
                                else if (typeof typedArgs.orderBy === 'object' && fieldName in typedArgs.orderBy) {
                                    delete typedArgs.orderBy[fieldName];
                                }
                            }
                            // Handle nested where conditions
                            if (typedArgs.where && typedArgs.where.OR) {
                                typedArgs.where.OR = typedArgs.where.OR.map((condition) => {
                                    const cleanedCondition = { ...condition };
                                    if (fieldName in cleanedCondition) {
                                        delete cleanedCondition[fieldName];
                                    }
                                    return cleanedCondition;
                                }).filter((c) => Object.keys(c).length > 0);
                                if (typedArgs.where.OR.length === 0) {
                                    delete typedArgs.where.OR;
                                }
                            }
                            if (typedArgs.where && typedArgs.where.AND) {
                                typedArgs.where.AND = typedArgs.where.AND.map((condition) => {
                                    const cleanedCondition = { ...condition };
                                    if (fieldName in cleanedCondition) {
                                        delete cleanedCondition[fieldName];
                                    }
                                    return cleanedCondition;
                                }).filter((c) => Object.keys(c).length > 0);
                                if (typedArgs.where.AND.length === 0) {
                                    delete typedArgs.where.AND;
                                }
                            }
                            // Log the modified args for debugging
                            if (config_1.config.isDevelopment) {
                                logger_1.logger.debug(`Modified args after removing '${fieldName}':`, {
                                    modifiedArgs: JSON.stringify(args).substring(0, 500)
                                });
                            }
                            // Try the query again with the fixed args
                            return await query(args);
                        }
                    }
                    // If we couldn't handle the error, rethrow it
                    throw error;
                }
            }
        }
    }
});
/**
 * Connect to Prisma and setup event handlers
 */
const connectPrisma = async () => {
    try {
        // Connect to the database
        await basePrisma.$connect();
        logger_1.logger.info('Prisma client connected');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Failed to connect Prisma client:', error);
        return false;
    }
};
exports.connectPrisma = connectPrisma;
/**
 * Disconnect Prisma client
 */
const disconnectPrisma = async () => {
    try {
        await basePrisma.$disconnect();
        logger_1.logger.info('Prisma client disconnected');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting Prisma client:', error);
    }
};
exports.disconnectPrisma = disconnectPrisma;
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map