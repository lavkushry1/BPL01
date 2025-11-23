import { generateToken } from '../../utils/jwt';
import { request } from '../setup';
import { TestDataFactory } from './testDataFactory';

/**
 * Professional Test Utilities
 * Common helper functions used across all test suites
 * Following enterprise patterns from top tech companies
 */

/**
 * Authentication helpers
 */
export class AuthHelpers {
  /**
   * Create a user and return their auth token
   */
  static async createAuthenticatedUser(role: 'USER' | 'ORGANIZER' | 'ADMIN' = 'USER'): Promise<{
    userId: string;
    authToken: string;
  }> {
    const userId = await TestDataFactory.createUser({ role });
    const authToken = generateToken({ id: userId, role });
    return { userId, authToken };
  }

  /**
   * Create multiple authenticated users
   */
  static async createAuthenticatedUsers(count: number = 3): Promise<Array<{
    userId: string;
    authToken: string;
    role: 'USER' | 'ORGANIZER' | 'ADMIN';
  }>> {
    const users: Array<{ userId: string; authToken: string; role: 'USER' | 'ORGANIZER' | 'ADMIN' }> = [];

    for (let i = 0; i < count; i++) {
      const role: 'USER' | 'ORGANIZER' | 'ADMIN' =
        i === 0 ? 'ADMIN' : i === 1 ? 'ORGANIZER' : 'USER';
      const { userId, authToken } = await this.createAuthenticatedUser(role);
      users.push({ userId, authToken, role });
    }

    return users;
  }

  /**
   * Make an authenticated request
   */
  static authenticatedRequest(authToken: string) {
    return {
      get: (url: string) => request.get(url).set('Authorization', `Bearer ${authToken}`),
      post: (url: string) => request.post(url).set('Authorization', `Bearer ${authToken}`).type('json'),
      put: (url: string) => request.put(url).set('Authorization', `Bearer ${authToken}`).type('json'),
      delete: (url: string) => request.delete(url).set('Authorization', `Bearer ${authToken}`),
      patch: (url: string) => request.patch(url).set('Authorization', `Bearer ${authToken}`).type('json')
    };
  }
}

/**
 * Assertion helpers for common test patterns
 */
export class AssertionHelpers {
  /**
   * Assert standard API response structure
   */
  static assertApiResponse(response: any, expectedStatus: number = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
  }

  /**
   * Assert error response structure
   */
  static assertErrorResponse(response: any, expectedStatus: number = 400) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');
  }

  /**
   * Assert validation error with field details
   */
  static assertValidationError(response: any, expectedFields: string[]) {
    this.assertErrorResponse(response, 400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error).toHaveProperty('details');

    const errorPaths = response.body.error.details.map((d: any) => d.path);
    expectedFields.forEach(field => {
      expect(errorPaths).toContain(field);
    });
  }

  /**
   * Assert authentication error
   */
  static assertAuthError(response: any) {
    this.assertErrorResponse(response, 401);
    expect(response.body.error.code).toMatch(/AUTH|UNAUTHORIZED/i);
  }

  /**
   * Assert authorization error (forbidden)
   */
  static assertForbiddenError(response: any) {
    this.assertErrorResponse(response, 403);
    expect(response.body.error.code).toMatch(/FORBIDDEN|UNAUTHORIZED/i);
  }

  /**
   * Assert entity has required timestamps
   */
  static assertHasTimestamps(entity: any) {
    expect(entity).toHaveProperty('createdAt');
    expect(entity).toHaveProperty('updatedAt');
    expect(new Date(entity.createdAt)).toBeInstanceOf(Date);
    expect(new Date(entity.updatedAt)).toBeInstanceOf(Date);
  }

  /**
   * Assert UUID format
   */
  static assertIsUUID(value: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(value).toMatch(uuidRegex);
  }
}

/**
 * Time helpers for consistent date handling
 */
export class TimeHelpers {
  /**
   * Get a date in the future
   */
  static futureDate(daysFromNow: number = 30): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }

  /**
   * Get a date in the past
   */
  static pastDate(daysAgo: number = 30): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  /**
   * Format date for API (ISO string)
   */
  static toAPIDate(date: Date = new Date()): string {
    return date.toISOString();
  }

  /**
   * Create a date range for events
   */
  static createEventDateRange(startDaysFromNow: number = 30): {
    startDate: Date;
    endDate: Date;
  } {
    const startDate = this.futureDate(startDaysFromNow);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // 2-day event
    return { startDate, endDate };
  }
}

/**
 * Wait helpers for async operations
 */
export class WaitHelpers {
  /**
   * Wait for a specified number of milliseconds
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for a condition to become true
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.wait(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Retry an operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await this.wait(baseDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }
}

/**
 * Data generation helpers
 */
export class DataGenerators {
  /**
   * Generate a random email
   */
  static randomEmail(prefix: string = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  }

  /**
   * Generate a random phone number (Indian format)
   */
  static randomPhone(): string {
    return `+91${Math.floor(9000000000 + Math.random() * 1000000000)}`;
  }

  /**
   * Generate random price in paisa (for Indian currency)
   */
  static randomPrice(min: number = 500, max: number = 5000): number {
    return Math.floor(Math.random() * (max - min + 1) + min) * 100; // Convert to paisa
  }

  /**
   * Generate a random quantity
   */
  static randomQuantity(min: number = 1, max: number = 4): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /**
   * Generate a realistic UTR number
   */
  static generateUTR(): string {
    return `UTR${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }
}

/**
 * Database helpers
 */
export class DatabaseHelpers {
  /**
   * Check if a record exists
   */
  static async recordExists(table: string, id: string): Promise<boolean> {
    const db = (await import('../../db')).default;
    const record = await db(table).where('id', id).first();
    return !!record;
  }

  /**
   * Get record count
   */
  static async getCount(table: string, where?: Record<string, any>): Promise<number> {
    const db = (await import('../../db')).default;
    const query = db(table);

    if (where) {
      Object.entries(where).forEach(([key, value]) => {
        query.where(key, value);
      });
    }

    const result = await query.count('* as count').first();
    return result ? Number(result.count) : 0;
  }

  /**
   * Truncate all test tables (use with caution!)
   */
  static async truncateAll(): Promise<void> {
    const db = (await import('../../db')).default;
    const tables = ['payments', 'bookings', 'ticket_categories', 'events', 'users'];

    for (const table of tables) {
      await db(table).del();
    }
  }
}

/**
 * Re-export commonly used helpers
 */
export {
    AssertionHelpers as Assert, AuthHelpers as Auth, DatabaseHelpers as Database, DataGenerators as Generate, TestDataFactory, TimeHelpers as Time,
    WaitHelpers as Wait
};
