"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const cron_1 = require("cron");
const logger_1 = require("../utils/logger");
const seat_service_1 = require("./seat.service");
const ticket_service_1 = require("./ticket.service");
const config_1 = require("../config");
/**
 * Service for managing background jobs
 */
class JobService {
    static jobs = [];
    /**
     * Initialize all background jobs
     */
    static initialize() {
        try {
            logger_1.logger.info('Initializing background jobs');
            // Release expired seat locks - every minute
            this.registerJob('0 * * * * *', 'release-expired-locks', async () => {
                try {
                    const releasedCount = await seat_service_1.SeatService.releaseExpiredLocks();
                    if (releasedCount > 0) {
                        logger_1.logger.info(`Released ${releasedCount} expired seat locks`);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Error releasing expired seat locks:', error);
                }
            });
            // Process expired seat reservations - every 2 minutes
            this.registerJob('0 */2 * * * *', 'process-expired-reservations', async () => {
                try {
                    const result = await seat_service_1.SeatService.processExpiredReservations();
                    if (result > 0) {
                        logger_1.logger.info(`Processed ${result} expired seat reservations`);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Error processing expired seat reservations:', error);
                }
            });
            // Process ticket generation queue - every 3 minutes
            this.registerJob('0 */3 * * * *', 'process-ticket-generation-queue', async () => {
                try {
                    const result = await ticket_service_1.TicketService.processTicketGenerationQueue();
                    if (result.processed > 0) {
                        logger_1.logger.info(`Processed ${result.processed} ticket generation jobs: ${result.success} successful, ${result.failed} failed`);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Error processing ticket generation queue:', error);
                }
            });
            // Start all registered jobs
            this.startAllJobs();
            logger_1.logger.info(`${this.jobs.length} background jobs initialized and started`);
        }
        catch (error) {
            logger_1.logger.error('Error initializing background jobs:', error);
        }
    }
    /**
     * Register a new job
     * @param cronExpression When to run the job
     * @param name Job name for identification
     * @param task The function to execute
     */
    static registerJob(cronExpression, name, task) {
        try {
            // Create job with the provided task
            const job = new cron_1.CronJob(cronExpression, async () => {
                const startTime = Date.now();
                logger_1.logger.debug(`Starting job: ${name}`);
                try {
                    await task();
                    const duration = Date.now() - startTime;
                    logger_1.logger.debug(`Completed job: ${name} (${duration}ms)`);
                }
                catch (error) {
                    const duration = Date.now() - startTime;
                    logger_1.logger.error(`Job ${name} failed after ${duration}ms:`, error);
                }
            }, null, // onComplete
            false, // start
            config_1.config.timezone || 'UTC' // timezone
            );
            this.jobs.push(job);
            logger_1.logger.debug(`Registered job: ${name} (${cronExpression})`);
        }
        catch (error) {
            logger_1.logger.error(`Error registering job ${name}:`, error);
        }
    }
    /**
     * Start all registered jobs
     */
    static startAllJobs() {
        this.jobs.forEach(job => {
            if (!job.running) {
                job.start();
            }
        });
    }
    /**
     * Stop all running jobs
     */
    static stopAllJobs() {
        this.jobs.forEach(job => {
            if (job.running) {
                job.stop();
            }
        });
        logger_1.logger.info('All background jobs stopped');
    }
    /**
     * Manually trigger a job by name
     * @param name Job name
     * @returns Success status
     */
    static async triggerJob(name) {
        // Find matching jobs
        const matchingJobs = this.jobs.filter(job => job.name === name);
        if (matchingJobs.length === 0) {
            logger_1.logger.warn(`No job found with name: ${name}`);
            return false;
        }
        try {
            // Execute each matching job
            for (const job of matchingJobs) {
                await job.fireOnTick();
            }
            logger_1.logger.info(`Manually triggered job: ${name}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error triggering job ${name}:`, error);
            return false;
        }
    }
}
exports.JobService = JobService;
