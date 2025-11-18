"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.app = void 0;
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../app");
const db_1 = __importDefault(require("../db"));
// Mock Redis-related modules to prevent actual connections during tests
jest.mock('../services/cacheService', () => ({
    cacheService: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        delByPattern: jest.fn(),
        isConnected: jest.fn(() => true),
        close: jest.fn(),
    },
}));
jest.mock('../middleware/rateLimit', () => ({
    standardLimiter: jest.fn((req, res, next) => next()),
    apiKeyLimiter: jest.fn((req, res, next) => next()),
    strictLimiter: jest.fn((req, res, next) => next()),
    authLimiter: jest.fn((req, res, next) => next()),
    loginLimiter: jest.fn((req, res, next) => next()), // Add this line
}));
let app;
// Change the type to any to avoid complex typings issue with supertest
let request;
// Setup before tests
beforeAll(async () => {
    // Ensure we're using test environment
    process.env.NODE_ENV = 'test';
    // Initialize the app
    const { app: createdApp } = await (0, app_1.createApp)();
    exports.app = app = createdApp;
    exports.request = request = (0, supertest_1.default)(app);
    // Run migrations to setup test database
    await db_1.default.migrate.latest();
});
// Clean up after tests
afterAll(async () => {
    // Rollback migrations
    await db_1.default.migrate.rollback(undefined, true);
    // Close database connection
    await db_1.default.destroy();
});
//# sourceMappingURL=setup.js.map