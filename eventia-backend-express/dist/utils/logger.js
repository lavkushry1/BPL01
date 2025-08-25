"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create logs directory if it doesn't exist
const logDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir);
}
// Define log formats
const formats = [
    winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston_1.default.format.errors({ stack: true }),
    winston_1.default.format.splat(),
    winston_1.default.format.json()
];
// Create the logger instance
exports.logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels: winston_1.default.config.npm.levels,
    format: winston_1.default.format.combine(...formats),
    transports: [
        // Write logs to files in production
        ...(process.env.NODE_ENV === 'production'
            ? [
                new winston_1.default.transports.File({
                    filename: path_1.default.join(logDir, 'error.log'),
                    level: 'error',
                    maxsize: 10485760, // 10MB
                    maxFiles: 5
                }),
                new winston_1.default.transports.File({
                    filename: path_1.default.join(logDir, 'combined.log'),
                    maxsize: 10485760, // 10MB
                    maxFiles: 5
                })
            ]
            : []),
        // Console logging for all environments
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`))
        })
    ]
});
// Stream object for Morgan HTTP logger
exports.stream = {
    write: (message) => {
        exports.logger.info(message.trim());
    }
};
// Override console methods to use Winston (in non-production environments)
if (process.env.NODE_ENV !== 'production') {
    console.log = (message, ...args) => {
        exports.logger.info(message, ...args);
        return message;
    };
    console.info = (message, ...args) => {
        exports.logger.info(message, ...args);
        return message;
    };
    console.warn = (message, ...args) => {
        exports.logger.warn(message, ...args);
        return message;
    };
    console.error = (message, ...args) => {
        exports.logger.error(message, ...args);
        return message;
    };
    console.debug = (message, ...args) => {
        exports.logger.debug(message, ...args);
        return message;
    };
}
//# sourceMappingURL=logger.js.map