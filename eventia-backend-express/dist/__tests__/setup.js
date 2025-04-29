"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.app = void 0;
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
const db_1 = __importDefault(require("../db"));
let app;
// Change the type to any to avoid complex typings issue with supertest
let request;
// Setup before tests
beforeAll(async () => {
    // Ensure we're using test environment
    process.env.NODE_ENV = 'test';
    // Initialize the app
    exports.app = app = await (0, server_1.createApp)();
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
