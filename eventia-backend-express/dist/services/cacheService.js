"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class CacheService {
    client;
    isReady = false;
    constructor() {
        this.client = new ioredis_1.default({
            host: config_1.config.redis.host || 'localhost',
            port: config_1.config.redis.port || 6379,
            password: config_1.config.redis.password,
            db: config_1.config.redis.db || 0,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });
        this.client.on('connect', () => {
            this.isReady = true;
            logger_1.logger.info('Redis cache connected');
        });
        this.client.on('error', (err) => {
            this.isReady = false;
            logger_1.logger.error('Redis cache error', { error: err.message });
        });
    }
    /**
     * Get data from cache
     */
    async get(key) {
        if (!this.isReady)
            return null;
        try {
            const data = await this.client.get(key);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.logger.error('Error getting data from cache', { key, error });
            return null;
        }
    }
    /**
     * Set data in cache with optional TTL in seconds
     */
    async set(key, data, ttl) {
        if (!this.isReady)
            return false;
        try {
            const serialized = JSON.stringify(data);
            if (ttl) {
                await this.client.set(key, serialized, 'EX', ttl);
            }
            else {
                await this.client.set(key, serialized);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error setting data in cache', { key, error });
            return false;
        }
    }
    /**
     * Delete a key from cache
     */
    async del(key) {
        if (!this.isReady)
            return false;
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting key from cache', { key, error });
            return false;
        }
    }
    /**
     * Delete multiple keys matching a pattern
     */
    async delByPattern(pattern) {
        if (!this.isReady)
            return false;
        try {
            // SCAN is more efficient than KEYS for large datasets
            let cursor = '0';
            do {
                const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
                cursor = nextCursor;
                if (keys.length > 0) {
                    await this.client.del(...keys);
                }
            } while (cursor !== '0');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting keys by pattern from cache', { pattern, error });
            return false;
        }
    }
    /**
     * Check if cache is ready
     */
    isConnected() {
        return this.isReady;
    }
    /**
     * Close Redis connection
     */
    async close() {
        if (this.isReady) {
            await this.client.quit();
            this.isReady = false;
        }
    }
}
// Export singleton instance
exports.cacheService = new CacheService();
//# sourceMappingURL=cacheService.js.map