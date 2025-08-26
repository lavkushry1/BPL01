import knex, { Knex } from 'knex';
import { config } from '../config';
import path from 'path';
import { logger } from '../utils/logger';

// Configuration for database connection
const dbConfig: Knex.Config = {
  migrations: {
    directory: path.join(__dirname, '../../prisma/migrations'),
    tableName: 'knex_migrations',
  },
  client: 'pg',
  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false
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
  debug: config.nodeEnv === 'development',
  // Disable debug in tests and production
  log: {
    warn: (msg: string) => logger.warn(msg),
    error: (msg: string) => logger.error(msg),
    debug: (msg: string) => {
      if (config.nodeEnv === 'development') {
        logger.debug(msg);
      }
    }
  }
};

// Create the knex instance
export const db = knex(dbConfig);

// Add this line to ensure Knex is properly initialized with the migration directory
// This is crucial for the `db.migrate.latest()` and `db.migrate.rollback()` calls in setup.ts
// to find the migration files.
// db.migrate.directory = '../prisma/migrations'; // This line is not needed if directory is set in dbConfig

// Max retry attempts
const MAX_RETRIES = 5;
// Initial retry delay in ms
const INITIAL_RETRY_DELAY = 1000;

/**
 * Initialize the database connection with retry logic
 */
export const initializeDatabase = async (): Promise<void> => {
  let retries = 0;
  let connected = false;

  while (!connected && retries < MAX_RETRIES) {
    try {
      logger.info('Attempting to connect to database...');
      // Test the connection
      await db.raw('SELECT 1');
      connected = true;
      logger.info('Successfully connected to database');
    } catch (error: unknown) {
      retries++;
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries - 1);
      // Handle error correctly by checking if it's an Error object
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to connect to database (attempt ${retries}/${MAX_RETRIES}): ${errorMessage}`);
      logger.info(`Retrying in ${delay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (!connected) {
    logger.error(`Failed to connect to database after ${MAX_RETRIES} attempts`);
    // This will trigger process exit in the server.ts file
    throw new Error('Unable to establish database connection');
  }
};

/**
 * Check database connection health
 * @returns {Promise<boolean>} True if connection is healthy
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // Test a simple query to check connection
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

/**
 * Gracefully close the database connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    logger.info('Closing database connection...');
    await db.destroy();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

export default db;
