#!/usr/bin/env ts-node

/**
 * Script to test the UserProfile API functionality
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testUserProfileAPI() {
  try {
    console.log('Testing UserProfile API functionality...');

    // Create a test user
    const password = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: `test-profile-api-${Date.now()}@example.com`,
        name: 'Test Profile API User',
        password: password,
        role: 'USER'
      }
    });

    console.log('Created user:', user.id);

    // Create a user profile
    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        street: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        postalCode: '12345',
        country: 'Country'
      }
    });

    console.log('Created profile:', profile.id);

    // Fetch the user with profile
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true }
    });

    console.log('User with profile:', JSON.stringify(userWithProfile, null, 2));

    console.log('UserProfile API functionality test completed successfully!');
  } catch (error) {
    console.error('Error testing UserProfile API functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserProfileAPI();
