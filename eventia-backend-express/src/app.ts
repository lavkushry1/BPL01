import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './docs/swagger';
import { ApiError } from './utils/apiError';
import { logger } from './utils/logger';
import { createServer } from 'http';
import { WebsocketService } from './services/websocket.service';
import { JobService } from './services/job.service';
import { validateCsrfToken, generateCsrfToken } from './middleware/csrf';
import { standardLimiter } from './middleware/rateLimit';
import { dataloaderMiddleware } from './middleware/dataloader.middleware';

// Import route files
import legacyRoutes from './routes';
import v1Routes from './routes/v1';

export const createApp = async (): Promise<{ app: Application; server: any }> => {
  const app: Application = express();
  const server = createServer(app);

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
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Apply standard rate limiting to all routes
  app.use(standardLimiter);

  // Generate CSRF token for GET requests and validate for state-changing methods
  app.use((req, res, next) => {
    if (req.method === 'GET') {
      generateCsrfToken(req, res, next);
    } else {
      validateCsrfToken(req, res, next);
    }
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
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'ok', 
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown'
    });
  });

  // Handle 404 routes
  app.use('*', (req: Request, res: Response, next: NextFunction) => {
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