import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

class CacheService {
  private client: Redis;
  private isReady: boolean = false;

  constructor() {
    this.client = new Redis({
      host: config.redis.host || 'localhost',
      port: config.redis.port || 6379,
      password: config.redis.password,
      db: config.redis.db || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('connect', () => {
      this.isReady = true;
      logger.info('Redis cache connected');
    });

    this.client.on('error', (err) => {
      this.isReady = false;
      logger.error('Redis cache error', { error: err.message });
    });
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady) return null;
    
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Error getting data from cache', { key, error });
      return null;
    }
  }

  /**
   * Set data in cache with optional TTL in seconds
   */
  async set(key: string, data: any, ttl?: number): Promise<boolean> {
    if (!this.isReady) return false;
    
    try {
      const serialized = JSON.stringify(data);
      
      if (ttl) {
        await this.client.set(key, serialized, 'EX', ttl);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      logger.error('Error setting data in cache', { key, error });
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isReady) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Error deleting key from cache', { key, error });
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delByPattern(pattern: string): Promise<boolean> {
    if (!this.isReady) return false;
    
    try {
      // SCAN is more efficient than KEYS for large datasets
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          '100'
        );
        
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
      
      return true;
    } catch (error) {
      logger.error('Error deleting keys by pattern from cache', { pattern, error });
      return false;
    }
  }

  /**
   * Check if cache is ready
   */
  isConnected(): boolean {
    return this.isReady;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.isReady) {
      await this.client.quit();
      this.isReady = false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService(); 