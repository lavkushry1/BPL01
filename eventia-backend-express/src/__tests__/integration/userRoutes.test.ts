import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import db from '../../db';
import { Assert, Auth, TestDataFactory } from '../helpers/testUtils';
import { request } from '../setup';

describe('User Routes', () => {
  let user: { userId: string; authToken: string };

  // Seed test data before each test
  beforeEach(async () => {
    // Create an authenticated user using the factory
    // This handles UUID generation, password hashing, and DB insertion automatically
    user = await Auth.createAuthenticatedUser('USER');
  });

  afterEach(async () => {
    // Clean up all test data using the factory utility
    await TestDataFactory.cleanup();
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
        .type('json')
        .send(userData);

      Assert.assertApiResponse(response, 201);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();

      // Verify user was created in database
      const dbUser = await db('users').where('email', userData.email).first();
      expect(dbUser).toBeDefined();
      expect(dbUser.name).toBe(userData.name);
    });

    it('should return 400 when email already exists', async () => {
      // Create a dummy user to conflict with
      await TestDataFactory.createUser({
        email: 'existing@example.com'
      });

      const userData = {
        name: 'Duplicate User',
        email: 'existing@example.com',
        password: 'password123'
      };

      const response = await request
        .post('/api/v1/auth/register')
        .type('json')
        .send(userData);

      Assert.assertErrorResponse(response, 400);
    });

    it('should return 400 when required fields are missing', async () => {
      const userData = {
        name: 'Incomplete User',
        // Missing email
        password: 'password123'
      };

      const response = await request
        .post('/api/v1/auth/register')
        .type('json')
        .send(userData);

      Assert.assertErrorResponse(response, 400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      // Create a user with known credentials
      const email = 'login@example.com';
      const password = 'password123';
      await TestDataFactory.createUser({ email, password });

      const loginData = { email, password };

      const response = await request
        .post('/api/v1/auth/login')
        .type('json')
        .send(loginData);

      Assert.assertApiResponse(response, 200);
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 with incorrect password', async () => {
      // Create a user
      const email = 'wrongpass@example.com';
      await TestDataFactory.createUser({ email, password: 'correct' });

      const loginData = {
        email,
        password: 'wrongpassword'
      };

      const response = await request
        .post('/api/v1/auth/login')
        .type('json')
        .send(loginData);

      Assert.assertAuthError(response);
    });

    it('should return 404 with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request
        .post('/api/v1/auth/login')
        .type('json')
        .send(loginData);

      expect(response.status).toBe(404); // Keeping 404 as per original test, though 401 is often preferred for security
    });
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return user profile when authenticated', async () => {
      const response = await Auth.authenticatedRequest(user.authToken)
        .get('/api/v1/users/profile');

      Assert.assertApiResponse(response, 200);
      expect(response.body.data.id).toBe(user.userId);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request
        .get('/api/v1/users/profile');

      Assert.assertAuthError(response);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update user profile when authenticated', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '1234567890'
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .put('/api/v1/users/profile')
        .send(updateData);

      Assert.assertApiResponse(response, 200);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.phone).toBe(updateData.phone);

      // Verify database was updated
      const dbUser = await db('users').where('id', user.userId).first();
      expect(dbUser.name).toBe(updateData.name);
      expect(dbUser.phone).toBe(updateData.phone);
    });

    it('should not allow updating email to an existing email', async () => {
      // Create another user first
      await TestDataFactory.createUser({
        email: 'another@example.com'
      });

      const updateData = {
        email: 'another@example.com' // Try to update to existing email
      };

      const response = await Auth.authenticatedRequest(user.authToken)
        .put('/api/v1/users/profile')
        .send(updateData);

      Assert.assertErrorResponse(response, 400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should successfully logout', async () => {
      const response = await Auth.authenticatedRequest(user.authToken)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(200);
    });
  });
});
