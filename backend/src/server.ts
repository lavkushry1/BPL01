import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initializeDatabase, closeDatabase, checkDatabaseHealth } from './db';
import { WebsocketService } from './services/websocket.service';
import { JobService } from './services/job.service';
import { connectPrisma, disconnectPrisma } from './db/prisma';

async function startServer() {
  try {
    // Initialize database connections
    let dbConnected = false;
    
    try {
      // Skip DB check if we're in a special test mode
      if (process.env.SKIP_DB_CHECK === 'true') {
        logger.warn('Skipping database connection check due to SKIP_DB_CHECK=true');
        dbConnected = true;
      } else {
        // Initialize Knex database connection with retries
        await initializeDatabase();
        
        // Connect Prisma client
        await connectPrisma();
        
        // Verify database health
        dbConnected = await checkDatabaseHealth();
      }
    } catch (error) {
      logger.error('Database connection error:', error);
    }
    
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Create Express app with HTTP server
    const { app, server } = await createApp();
    
    // Initialize Socket.IO
    const io = new SocketIOServer(server, {
      cors: {
        origin: config.frontendUrl || '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    // Initialize WebSocket service with the Socket.IO server
    WebsocketService.initialize(server);
    
    // Initialize background job service
    JobService.initialize();
    
    // Start server
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`API documentation available at http://localhost:${config.port}/api-docs`);
      logger.info('WebSocket server initialized');
    });
    
    // Setup periodic health check for database
    const healthCheckInterval = setInterval(async () => {
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        logger.error('Database health check failed in periodic check');
      }
    }, 60000); // Check every minute
    
    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      
      // Clear health check interval
      clearInterval(healthCheckInterval);
      
      // Stop all background jobs
      JobService.stopAllJobs();
      
      // Close database connections
      try {
        await closeDatabase();
        await disconnectPrisma();
      } catch (error) {
        logger.error('Error closing database connections:', error);
      }
      
      // Close server connections
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      
      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    // Handle graceful shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION:', err);
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server if this file is executed directly
if (require.main === module) {
  startServer();
}

export default startServer;
