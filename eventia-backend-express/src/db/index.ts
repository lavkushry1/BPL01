
import knex from 'knex';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialize knex with our database configuration
export const db = knex({
  client: 'pg',
  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: config.db.max,
    idleTimeoutMillis: config.db.idleTimeoutMillis,
    acquireTimeoutMillis: 30000,
  },
  debug: !config.isProduction,
});

// Test the database connection
export async function testConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1+1 AS result');
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Register connection handling events
db.on('query', (query) => {
  if (!config.isProduction) {
    logger.debug(`Query: ${query.sql}`, { bindings: query.bindings });
  }
});

db.on('query-error', (error, query) => {
  logger.error(`Query error: ${query.sql}`, {
    bindings: query.bindings, 
    error
  });
});

export default db;
