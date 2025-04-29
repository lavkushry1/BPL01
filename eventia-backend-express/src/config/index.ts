import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

// Environment variables with defaults
export const config = {
  // Node environment
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Application settings
  port: process.env.PORT || 4000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@eventia.com',
  timezone: process.env.TIMEZONE || 'UTC',
  
  // Database configuration
  db: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'eventia',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    ssl: process.env.DB_SSL === 'true',
    isProduction: process.env.NODE_ENV === 'production'
  },
  
  // Redis cache configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  // JWT authentication
  jwt: {
    // Provide a development-only secret if JWT_SECRET is not set
    // In production, this will throw an error if JWT_SECRET is not set
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'development_secret_key_not_secure' : undefined),
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'development_refresh_secret_key_not_secure' : undefined),
    accessExpiration: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT || '2525', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@eventia.com',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@eventia.com',
  },
  
  // Task scheduling configuration
  tasks: {
    seatLockExpirationSeconds: parseInt(process.env.SEAT_LOCK_EXPIRATION_SECONDS || '900', 10), // 15 minutes
    ticketGenerationRetryMax: parseInt(process.env.TICKET_GENERATION_RETRY_MAX || '5', 10),
    ticketGenerationInitialDelaySeconds: parseInt(process.env.TICKET_GENERATION_INITIAL_DELAY_SECONDS || '60', 10), // 1 minute
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Static files configuration
  static: {
    maxAge: process.env.STATIC_MAX_AGE ? parseInt(process.env.STATIC_MAX_AGE, 10) : 86400000, // 1 day in milliseconds
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per window
  },
  
  // Cors origins as array for socket.io
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  
  // Common derived properties
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

// Validate required environment variables - only warn in development mode
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];

// Only show warnings in development mode, not in test mode to avoid cluttering test output
if (config.isDevelopment) {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Warning: Environment variable ${envVar} is not set.`);
    }
  }
}

export default config;
