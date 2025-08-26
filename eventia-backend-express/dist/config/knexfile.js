"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./index.js");
const path_1 = __importDefault(require("path"));
const knexConfig = {
    development: {
        client: 'pg',
        connection: {
            host: index_js_1.config.db.host,
            port: index_js_1.config.db.port,
            user: index_js_1.config.db.user,
            password: index_js_1.config.db.password,
            database: index_js_1.config.db.database,
        },
        migrations: {
            directory: path_1.default.join(__dirname, '../db/migrations'),
            tableName: 'knex_migrations',
        },
        seeds: {
            directory: path_1.default.join(__dirname, '../db/seeds'),
        },
        debug: true,
    },
    test: {
        client: 'pg',
        connection: {
            host: index_js_1.config.db.host,
            port: index_js_1.config.db.port,
            user: index_js_1.config.db.user,
            password: index_js_1.config.db.password,
            database: index_js_1.config.db.database,
        },
        migrations: {
            directory: path_1.default.join(__dirname, '../db/migrations'),
            tableName: 'knex_migrations',
        },
        seeds: {
            directory: path_1.default.join(__dirname, '../db/seeds/test'),
        },
    },
    production: {
        client: 'pg',
        connection: {
            host: index_js_1.config.db.host,
            port: index_js_1.config.db.port,
            user: index_js_1.config.db.user,
            password: index_js_1.config.db.password,
            database: index_js_1.config.db.database,
            ssl: { rejectUnauthorized: false },
        },
        pool: {
            min: 2,
            max: index_js_1.config.db.max,
        },
        migrations: {
            directory: path_1.default.join(__dirname, '../db/migrations'),
            tableName: 'knex_migrations',
        },
        seeds: {
            directory: path_1.default.join(__dirname, '../db/seeds/production'),
        },
    },
};
exports.default = knexConfig;
// Select the appropriate config based on environment
module.exports = knexConfig[index_js_1.config.nodeEnv] || knexConfig.development;
//# sourceMappingURL=knexfile.js.map