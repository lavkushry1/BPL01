import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './docs/swagger';
import { ApiError } from './utils/apiError';
import { logger } from './utils/logger';
import { createServer } from 'http';
import { WebsocketService } from './services/websocket.service';
import { JobService } from './services/job.service';

// Routes
import userRoutes from './routes/user.routes';
import eventRoutes from './routes/event.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import discountRoutes from './routes/discount.routes';
import healthRoutes from './routes/health.routes';

export const createApp = async (): Promise<{ app: Application; server: any }> => {
  const app: Application = express();
  const server = createServer(app);
  
  // Essential middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
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

  // Setup API routes
  app.use('/api', routes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/discounts', discountRoutes);
  app.use('/api/v1/health', healthRoutes);
  
  // Setup Swagger documentation
  setupSwagger(app);
  
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', environment: config.nodeEnv });
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