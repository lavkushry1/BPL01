import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db';
import { generateToken } from '../../utils/jwt';
import { request } from '../setup';

describe('User Routes', () => {
  let userId: string;
  let authToken: string;

  // Seed test data before each test
  beforeEach(async () => {
    // Clear users table
    await db('users').del();

    // Generate UUID manually for the user (Prisma requires it)
    userId = uuidv4();

    // Create a test user with hashed password
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db('users').insert({
      id: userId,  // Manual UUID
      name: 'Test User',
      email: 'testuser@example.com',
      password: hashedPassword,
      role: 'USER',
      createdAt: new Date(),  // Required Prisma timestamp
      updatedAt: new Date()   // Required Prisma timestamp
    });

    // Generate auth token for the test user
    authToken = generateToken({ id: userId, role: 'USER' });
  });

  afterEach(async () => {
    // Clean up test data
    await db('users').del();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'newpassword123'
      };

      const response = await request
        .post('/api/v1/auth/register')
        .type('json')  // Explicit Content-Type for body parsing
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();

      // Verify user was created in database
      const user = await db('users').where('email', userData.email).first();
      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
    });

    it('should return 400 when email already exists', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'testuser@example.com', // Already exists from beforeEach
        password: 'password123'
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });

    it('should return 400 when required fields are missing', async () => {
      const userData = {
        name: 'Incomplete User',
        // Missing email
        password: 'password123'
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'password123'
      };

      const response = await request
        .post('/api/v1/auth/login')
        .type('json')  // Explicit Content-Type for body parsing
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 with incorrect password', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'wrongpassword'
      };

      const response = await request
        .post('/api/v1/auth/login')
        .type('json')  // Explicit Content-Type for body parsing
        .send(loginData);

      expect(response.status).toBe(401);
    });

    it('should return 404 with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request
        .post('/api/v1/auth/login')
        .type('json')  // Explicit Content-Type for body parsing
        .send(loginData);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return user profile when authenticated', async () => {
      const response = await request
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('testuser@example.com');
      // Password should not be included in response
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request
        .get('/api/v1/users/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update user profile when authenticated', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '1234567890'
      };

      const response = await request
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .type('json')  // Explicit Content-Type for body parsing
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.phone).toBe(updateData.phone);

      // Verify database was updated
      const user = await db('users').where('id', userId).first();
      expect(user.name).toBe(updateData.name);
      expect(user.phone).toBe(updateData.phone);
    });

    it('should not allow updating email to an existing email', async () => {
      // Create another user first
      const anotherUserId = uuidv4();
      await db('users').insert({
        id: anotherUserId,  // Manual UUID
        name: 'Another User',
        email: 'another@example.com',
        password: 'hashedpassword',
        role: 'USER',
        createdAt: new Date(),  // Required Prisma timestamp
        updatedAt: new Date()   // Required Prisma timestamp
      });

      const updateData = {
        email: 'another@example.com' // Try to update to existing email
      };

      const response = await request
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .type('json')  // Explicit Content-Type for body parsing
        .send(updateData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should successfully logout', async () => {
      const response = await request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // In a real implementation, the token would be invalidated
      // This test just verifies the endpoint returns success
    });
  });
});
