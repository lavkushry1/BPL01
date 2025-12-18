import request from 'supertest';
import { app } from '../../app'; // Assuming app is exported from src/app.ts
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Security & Auth Integration Tests', () => {
  
  // Scenario 1: Unauthorized Access
  test('Unauthorized Access: Try to hit POST /api/admin/add-match without Admin Token -> Expect 403', async () => {
    // 1. Create a regular user token
    const userPayload = { id: 'user-123', role: 'USER' };
    const userToken = jwt.sign(userPayload, config.jwtSecret, { expiresIn: '1h' });

    // 2. Attempt to access protected admin route
    // Note: Adjust the route path if /api/admin/add-match is different in reality, 
    // e.g., /api/v1/events (POST) which is usually admin only.
    const response = await request(app)
      .post('/api/v1/admin/matches') // Assuming this is the route
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Unauthorized Match',
        date: new Date()
      });

    // 3. Expect 403 Forbidden (or 401 if logic dictates)
    expect(response.status).toBe(403);
  });

  // Scenario 2: Session Timeout
  test('Session Timeout: Simulate a token expiration during booking -> Expect 401', async () => {
    // 1. Create an expired token (or expiring immediately)
    // Using a negative expiration to simulate immediate expiry
    const expiredPayload = { id: 'user-456', role: 'USER' };
    // Verify config.jwtSecret is available, else mock it
    const secret = config.jwtSecret || 'test-secret';
    
    // Create a token that was valid in the past
    // iat (issued at) = now - 2 hours, exp = now - 1 hour
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = jwt.sign({
        ...expiredPayload,
        iat: now - 7200,
        exp: now - 3600 
    }, secret);

    // 2. Attempt to perform a secured action (e.g., Book Ticket)
    const response = await request(app)
      .post('/api/v1/bookings') // generic booking endpoint
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({
        matchId: 'some-match-id',
        seats: ['A1']
      });

    // 3. Expect 401 Unauthorized
    expect(response.status).toBe(401);
  });
});
