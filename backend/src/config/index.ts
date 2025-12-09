import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Define environment-specific .env file paths
const envFiles = {
  production: '.env.production',
  development: '.env.development',
  test: '.env.test',
};

// Load the appropriate .env file based on NODE_ENV
const envFile = envFiles[process.env.NODE_ENV as keyof typeof envFiles] || '.env';
const envPath = path.resolve(process.cwd(), envFile);

// Load environment variables from the selected .env file
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envFile}`);
  dotenv.config({ path: envPath });
} else {
  console.log('Using default .env file');
  dotenv.config();
}

// Define strongly typed configuration interfaces
interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  user: string;
  password: string | undefined;
  database: string;
  max: number;
  idleTimeoutMillis: number;
  ssl: boolean;
  isProduction: boolean;
}

interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessExpiration: string;
  refreshExpiration: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string | undefined;
  from: string;
  replyTo: string;
}

interface TasksConfig {
  seatLockExpirationSeconds: number;
  ticketGenerationRetryMax: number;
  ticketGenerationInitialDelaySeconds: number;
}

interface LoggingConfig {
  level: string;
  file: string;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RedisConfig {
  host: string;
  port: number;
  password: string | undefined;
  db: number;
}

interface UpiPaymentConfig {
  merchantUpiId: string;
  merchantName: string;
  webhookSecret: string;
  qrCodeBaseUrl: string;
}

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  publicKey: string;
}

interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  frontendUrl: string;
  clientUrl: string;
  supportEmail: string;
  timezone: string;
  db: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  email: EmailConfig;
  tasks: TasksConfig;
  stripe: StripeConfig;
  razorpay: RazorpayConfig;
  cors: {
    origin: string;
  };
  static: {
    maxAge: number;
  };
  logging: LoggingConfig;
  rateLimit: RateLimitConfig;
  upiPayment: UpiPaymentConfig;
  corsOrigins: string[];
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

// Create the configuration with strong typing
export const config: AppConfig = {
  // Node environment
  nodeEnv: process.env.NODE_ENV || 'development',

  // Application settings
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@eventia.com',
  timezone: process.env.TIMEZONE || 'UTC',

  // Database configuration
  db: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || (process.env.NODE_ENV === 'test' ? 'lavkushkumar' : 'postgres'),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || (process.env.NODE_ENV === 'test' ? 'eventia_test' : 'eventia'),
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    ssl: process.env.DB_SSL === 'true',
    isProduction: process.env.NODE_ENV === 'production'
  },

  // Redis cache configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // JWT authentication
  jwt: {
    // In production, require actual secrets; in development, use defaults
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'development_secret_key_not_secure'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'development_refresh_secret_key_not_secure'),
    accessExpiration: process.env.JWT_EXPIRES_IN || '15m', // Shorter access token life
    refreshExpiration: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT || '2525', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD,
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

  // UPI payment configuration
  upiPayment: {
    merchantUpiId: process.env.UPI_MERCHANT_ID || '9122036484@hdfc',
    merchantName: process.env.UPI_MERCHANT_NAME || 'Eventia Tickets',
    webhookSecret: process.env.UPI_WEBHOOK_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'webhook_secret_for_development'),
    qrCodeBaseUrl: process.env.UPI_QR_CODE_BASE_URL || 'https://api.qrserver.com/v1/create-qr-code/',
  },

  // Stripe payment configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || (process.env.NODE_ENV === 'production' ? '' : 'sk_test_dummy_key_for_development'),
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'whsec_dummy_key_for_development'),
    publicKey: process.env.STRIPE_PUBLIC_KEY || (process.env.NODE_ENV === 'production' ? '' : 'pk_test_dummy_key_for_development'),
  },

  // Razorpay payment configuration
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || (process.env.NODE_ENV === 'production' ? '' : 'rzp_test_dummy_key'),
    keySecret: process.env.RAZORPAY_KEY_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'rzp_secret_dummy_key'),
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'webhook_secret_razorpay'),
  },

  // Cors origins as array for socket.io
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'],

  // Common derived properties
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

// Function to validate the configuration
const validateConfig = (cfg: AppConfig): void => {
  const requiredVars: Array<{key: string, path: string}> = [
    { key: cfg.db.url, path: 'DATABASE_URL' },
    { key: cfg.jwt.secret, path: 'JWT_SECRET' },
    { key: cfg.jwt.refreshSecret, path: 'JWT_REFRESH_SECRET' },
  ];

  // Only enforce validation in production
  if (cfg.isProduction) {
    const missingVars = requiredVars.filter(v => !v.key);

    if (missingVars.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingVars.map(v => v.path).join(', ')}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Additional security validation for production
    if (cfg.jwt.secret.length < 32) {
      throw new Error('JWT_SECRET is too short for production. Use at least 32 characters.');
    }

    if (cfg.jwt.refreshSecret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET is too short for production. Use at least 32 characters.');
    }
  }

  // Check for potentially insecure configurations
  if (cfg.isProduction) {
    if (cfg.jwt.secret.includes('dev') || cfg.jwt.refreshSecret.includes('dev')) {
      throw new Error('Production environment contains development JWT secrets.');
    }

    // Verify SSL is enabled for production database
    if (!cfg.db.ssl) {
      console.warn('WARNING: Database SSL is disabled in production environment.');
    }
  }
};

// Helper to redact sensitive information for logging
const redactSensitiveInfo = (cfg: AppConfig): Record<string, any> => {
  const redacted = { ...cfg };

  // Redact database credentials
  if (redacted.db && redacted.db.password) {
    redacted.db = { ...redacted.db, password: '***REDACTED***' };
  }

  // Redact JWT secrets
  if (redacted.jwt) {
    redacted.jwt = {
      ...redacted.jwt,
      secret: '***REDACTED***',
      refreshSecret: '***REDACTED***'
    };
  }

  // Redact email password
  if (redacted.email && redacted.email.password) {
    redacted.email = { ...redacted.email, password: '***REDACTED***' };
  }

  // Redact Redis password
  if (redacted.redis && redacted.redis.password) {
    redacted.redis = { ...redacted.redis, password: '***REDACTED***' };
  }

  // Redact webhook secret
  if (redacted.upiPayment) {
    redacted.upiPayment = { ...redacted.upiPayment, webhookSecret: '***REDACTED***' };
  }

  // Redact Stripe secrets
  if (redacted.stripe) {
    redacted.stripe = {
      ...redacted.stripe,
      secretKey: '***REDACTED***',
      webhookSecret: '***REDACTED***'
    };
  }

  return redacted;
};

// Run validation
try {
  validateConfig(config);

  // Log configuration in non-production and non-test environments
  if (!config.isProduction && !config.isTest) {
    console.log('App configuration:', JSON.stringify(redactSensitiveInfo(config), null, 2));
  }
} catch (error) {
  console.error('Configuration error:', (error as Error).message);

  // Exit in production, only warn in development
  if (config.isProduction) {
    process.exit(1);
  }
}

export default config;
