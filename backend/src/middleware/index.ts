
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { stream } from '../utils/logger';

export function setupMiddleware(app: Application): void {
  // Security Headers
  app.use(helmet());
  
  // CORS configuration
  app.use(cors(config.cors));
  
  // JSON body parser
  app.use(express.json({ limit: '10mb' }));
  
  // URL encoded body parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Compression middleware
  app.use(compression());
  
  // Request logging
  app.use(
    morgan(config.isProduction ? 'combined' : 'dev', {
      stream,
    })
  );
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max, 
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later',
  });
  
  // Apply rate limiting to all requests
  app.use(limiter);
  
  // Serve static files if needed
  app.use(express.static('public', {
    maxAge: config.static.maxAge,
  }));
}
