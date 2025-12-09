#!/usr/bin/env ts-node

/**
 * Script to test the UserProfile functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUserProfile() {
  try {
    console.log('Testing UserProfile functionality...');
    
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `test-profile-${Date.now()}@example.com`,
        name: 'Test Profile User',
        password: 'password123',
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
    
    console.log('User with profile:', userWithProfile);
    
    // Update the profile
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        street: '456 Oak Ave',
        city: 'Another City'
      }
    });
    
    console.log('Updated profile:', updatedProfile.id);
    
    // Fetch the user with updated profile
    const userWithUpdatedProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true }
    });
    
    console.log('User with updated profile:', userWithUpdatedProfile);
    
    console.log('UserProfile functionality test completed successfully!');
  } catch (error) {
    console.error('Error testing UserProfile functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserProfile();