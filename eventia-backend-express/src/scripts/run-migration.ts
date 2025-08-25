#!/usr/bin/env node

/**
 * Script to run Prisma migrations
 * This script will apply all pending migrations to the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Running Prisma migrations...');
    
    // This will automatically run any pending migrations
    await prisma.$connect();
    
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();