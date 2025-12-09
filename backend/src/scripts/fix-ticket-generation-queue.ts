#!/usr/bin/env node
/**
 * Script to fix ticket_generation_queue table column mappings
 * 
 * Usage:
 *   npm run fix-ticket-generation-queue
 *   
 * This script addresses the issue where the maxAttempts field was incorrectly
 * created in the database without proper snake case mapping.
 */

import { fixTicketGenerationQueue } from '../utils/fix-ticket-generation-queue';
import { logger } from '../utils/logger';

logger.info('Starting ticket generation queue fix script...');

fixTicketGenerationQueue()
  .then(() => {
    logger.info('Successfully fixed ticket_generation_queue table');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Failed to fix ticket_generation_queue table:', error);
    process.exit(1);
  }); 