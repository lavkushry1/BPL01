import fs from 'fs';
import path from 'path';
import winston from 'winston';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log formats
const formats = [
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
];

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  format: winston.format.combine(...formats),
  transports: [
    // Write logs to files in production
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5
          }),
          new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5
          })
        ]
      : []),
    // Console logging for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}${
            info.stack ? '\n' + info.stack : ''
          }`
        )
      )
    })
  ]
});

// Stream object for Morgan HTTP logger
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Override console methods to use Winston (in development only, NOT in tests)
if (process.env.NODE_ENV === 'development') {
  console.log = (message?: any, ...args: any[]) => {
    logger.info(message, ...args);
    return message;
  };

  console.info = (message?: any, ...args: any[]) => {
    logger.info(message, ...args);
    return message;
  };

  console.warn = (message?: any, ...args: any[]) => {
    logger.warn(message, ...args);
    return message;
  };

  console.error = (message?: any, ...args: any[]) => {
    logger.error(message, ...args);
    return message;
  };

  console.debug = (message?: any, ...args: any[]) => {
    logger.debug(message, ...args);
    return message;
  };
}
