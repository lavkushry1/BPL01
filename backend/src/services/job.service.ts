import { CronJob } from 'cron';
import { logger } from '../utils/logger';
import { SeatService } from './seat.service';
import { TicketService } from './ticket.service';
import { config } from '../config';

// Add CronJob type augmentation to add missing 'running' property
declare module 'cron' {
  interface CronJob {
    running: boolean;
  }
}

/**
 * Service for managing background jobs
 */
export class JobService {
  private static jobs: CronJob[] = [];

  /**
   * Initialize all background jobs
   */
  static initialize(): void {
    try {
      logger.info('Initializing background jobs');
      
      // Release expired seat locks - every minute
      this.registerJob('0 * * * * *', 'release-expired-locks', async () => {
        try {
          const releasedCount = await SeatService.releaseExpiredLocks();
          if (releasedCount > 0) {
            logger.info(`Released ${releasedCount} expired seat locks`);
          }
        } catch (error) {
          logger.error('Error releasing expired seat locks:', error);
        }
      });
      
      // Process expired seat reservations - every 2 minutes
      this.registerJob('0 */2 * * * *', 'process-expired-reservations', async () => {
        try {
          const result = await SeatService.processExpiredReservations();
          if (result > 0) {
            logger.info(`Processed ${result} expired seat reservations`);
          }
        } catch (error) {
          logger.error('Error processing expired seat reservations:', error);
        }
      });
      
      // Process ticket generation queue - every 3 minutes
      this.registerJob('0 */3 * * * *', 'process-ticket-generation-queue', async () => {
        try {
          const result = await TicketService.processTicketGenerationQueue();
          if (result.processed > 0) {
            logger.info(`Processed ${result.processed} ticket generation jobs: ${result.success} successful, ${result.failed} failed`);
          }
        } catch (error) {
          logger.error('Error processing ticket generation queue:', error);
        }
      });
      
      // Start all registered jobs
      this.startAllJobs();
      
      logger.info(`${this.jobs.length} background jobs initialized and started`);
    } catch (error) {
      logger.error('Error initializing background jobs:', error);
    }
  }

  /**
   * Register a new job
   * @param cronExpression When to run the job
   * @param name Job name for identification
   * @param task The function to execute
   */
  private static registerJob(
    cronExpression: string,
    name: string,
    task: () => Promise<void>
  ): void {
    try {
      // Create job with the provided task
      const job = new CronJob(
        cronExpression,
        async () => {
          const startTime = Date.now();
          logger.debug(`Starting job: ${name}`);
          
          try {
            await task();
            const duration = Date.now() - startTime;
            logger.debug(`Completed job: ${name} (${duration}ms)`);
          } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`Job ${name} failed after ${duration}ms:`, error);
          }
        },
        null, // onComplete
        false, // start
        config.timezone || 'UTC' // timezone
      );
      
      this.jobs.push(job);
      logger.debug(`Registered job: ${name} (${cronExpression})`);
    } catch (error) {
      logger.error(`Error registering job ${name}:`, error);
    }
  }

  /**
   * Start all registered jobs
   */
  private static startAllJobs(): void {
    this.jobs.forEach(job => {
      if (!job.running) {
        job.start();
      }
    });
  }

  /**
   * Stop all running jobs
   */
  static stopAllJobs(): void {
    this.jobs.forEach(job => {
      if (job.running) {
        job.stop();
      }
    });
    logger.info('All background jobs stopped');
  }

  /**
   * Manually trigger a job by name
   * @param name Job name
   * @returns Success status
   */
  static async triggerJob(name: string): Promise<boolean> {
    // Find matching jobs
    const matchingJobs = this.jobs.filter(job => job.name === name);
    
    if (matchingJobs.length === 0) {
      logger.warn(`No job found with name: ${name}`);
      return false;
    }
    
    try {
      // Execute each matching job
      for (const job of matchingJobs) {
        await job.fireOnTick();
      }
      
      logger.info(`Manually triggered job: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Error triggering job ${name}:`, error);
      return false;
    }
  }
}