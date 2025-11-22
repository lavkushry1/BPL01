import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import { config } from './config';
import { setupSwagger } from './docs/swagger';
import { generateCsrfToken, validateCsrfToken } from './middleware/csrf';
import { dataloaderMiddleware } from './middleware/dataloader.middleware';
import { errorHandler } from './middleware/errorHandler';
import { standardLimiter } from './middleware/rateLimit';
import { JobService } from './services/job.service';
import { WebsocketService } from './services/websocket.service';
import { ApiError } from './utils/apiError';
import { logger } from './utils/logger';

// Import route files
import legacyRoutes from './routes';
import v1Routes from './routes/v1';

export const createApp = async (): Promise<{ app: Application; server: any }> => {
  const app: Application = express();
  const server = createServer(app);

  // Essential middleware - MOVED TO TOP
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Debug middleware to check body parsing
  app.use((req, _res, next) => {
    if (process.env.NODE_ENV === 'test') {
      console.log('After BodyParser (Top) - req.body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });

  // Security headers using Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
        imgSrc: ["'self'", "data:", "https://api.qrserver.com"], // Allow QR code API
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"]
      }
    }
  }));

  // Compression middleware
  app.use(compression());

  // Request logging with Morgan
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      }
    },
    skip: (req) => {
      // Skip logging for health check endpoints to reduce noise
      return req.url.includes('/health');
    }
  }));

  // Essential middleware
  // express.json and urlencoded moved to top

  app.use(cookieParser());

  // Apply standard rate limiting to all routes
  app.use(standardLimiter);

  // Generate CSRF token for GET requests and validate for state-changing methods
  app.use((req, res, next) => {
    // Skip CSRF for tests
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    if (req.method === 'GET') {
      return generateCsrfToken(req, res, next);
    }
    return validateCsrfToken(req, res, next);
  });

  // Configure CORS to allow frontend access
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081'];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('CORS origin not allowed'), false);
      }
    },
    credentials: true
  }));

  // Apply DataLoader middleware to optimize database queries
  app.use(dataloaderMiddleware);
  logger.info('DataLoader middleware initialized for optimized queries');

  // Setup API routes
  // Legacy route setup - keep for backward compatibility
  app.use('/api', legacyRoutes);

  // Register v1 API routes
  app.use('/api/v1', v1Routes);

  // Setup Swagger documentation
  setupSwagger(app);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown'
    });
  });

  // Handle 404 routes
  app.use('*', (req: Request, _res: Response, next: NextFunction) => {
    next(ApiError.notFound(`Cannot find ${req.originalUrl} on this server`));
  });

  // Initialize WebSocket service
  WebsocketService.initialize(server);
  logger.info('WebSocket service initialized');

  // Schedule background jobs
  JobService.initialize();
  logger.info('Background jobs initialized');

  // Error handling middleware (must be after routes)
  app.use(errorHandler);

  return { app, server };
}
