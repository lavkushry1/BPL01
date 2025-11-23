import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db';

/**
 * Professional Test Data Factory
 * Following patterns from Google, Apple, and other top tech companies
 *
 * Benefits:
 * - Eliminates duplicate test setup code
 * - Type-safe entity creation
 * - Consistent test data across all tests
 * - Easy to create both "real" and "dummy" data
 * - Supports foreign key dependencies
 */

export interface UserFactoryOptions {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: 'USER' | 'ORGANIZER' | 'ADMIN';
  phone?: string;
  customFields?: Record<string, any>;
}

export interface EventFactoryOptions {
  id?: string;
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  organizerId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  customFields?: Record<string, any>;
}

export interface TicketCategoryFactoryOptions {
  id?: string;
  eventId?: string;
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  maxPerOrder?: number;
  customFields?: Record<string, any>;
}

export interface BookingFactoryOptions {
  id?: string;
  eventId?: string;
  userId?: string;
  ticketCategoryId?: string;
  quantity?: number;
  totalPrice?: number;
  status?: 'pending' | 'confirmed' | 'cancelled';
  customFields?: Record<string, any>;
}

export interface PaymentFactoryOptions {
  id?: string;
  bookingId?: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'verified' | 'failed';
  paymentMethod?: string;
  utrNumber?: string;
  customFields?: Record<string, any>;
}

/**
 * Test Data Factory Class
 * Provides methods to create test entities with sensible defaults
 */
export class TestDataFactory {
  /**
   * Create a user entity
   * @param options - Override default values
   * @returns User ID
   */
  static async createUser(options: UserFactoryOptions = {}): Promise<string> {
    const userId = options.id || uuidv4();
    const hashedPassword = await bcrypt.hash(options.password || 'Test123!@#', 10);

    const userData = {
      id: userId,
      name: options.name || 'Test User',
      email: options.email || `test-${userId.substring(0, 8)}@example.com`,
      password: hashedPassword,
      role: options.role || 'USER',
      phone: options.phone || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options.customFields
    };

    await db('users').insert(userData);
    return userId;
  }

  /**
   * Create an organizer user (convenience method)
   */
  static async createOrganizer(options: UserFactoryOptions = {}): Promise<string> {
    return this.createUser({ ...options, role: 'ORGANIZER' });
  }

  /**
   * Create an admin user (convenience method)
   */
  static async createAdmin(options: UserFactoryOptions = {}): Promise<string> {
    return this.createUser({ ...options, role: 'ADMIN' });
  }

  /**
   * Create a "dummy" user with minimal data
   */
  static async createDummyUser(): Promise<string> {
    return this.createUser({
      name: 'Dummy User',
      email: `dummy-${Date.now()}@example.com`,
      password: 'dummy123'
    });
  }

  /**
   * Create a "real" user with realistic data
   */
  static async createRealUser(index: number = 1): Promise<string> {
    const realNames = [
      'John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis',
      'Michael Brown', 'Sarah Wilson', 'David Martinez', 'Lisa Anderson'
    ];
    const name = realNames[index % realNames.length];
    const [firstName, lastName] = name.split(' ');

    return this.createUser({
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      password: 'SecurePass123!',
      phone: `+91${9000000000 + index}`,
      role: index % 3 === 0 ? 'ORGANIZER' : 'USER'
    });
  }

  /**
   * Create an event entity
   * @param organizerId - Required foreign key
   * @param options - Override default values
   * @returns Event ID
   */
  static async createEvent(
    organizerId: string,
    options: EventFactoryOptions = {}
  ): Promise<string> {
    const eventId = options.id || uuidv4();

    const eventData = {
      id: eventId,
      title: options.title || 'Test Event',
      description: options.description || 'Test event description',
      start_date: options.startDate || new Date('2024-06-01'),
      end_date: options.endDate || new Date('2024-06-03'),
      location: options.location || 'Test Location',
      organizer_id: organizerId,
      status: options.status || 'PUBLISHED',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options.customFields
    };

    await db('events').insert(eventData);
    return eventId;
  }

  /**
   * Create a "dummy" event with minimal data
   */
  static async createDummyEvent(organizerId: string): Promise<string> {
    return this.createEvent(organizerId, {
      title: 'Dummy Event',
      description: 'Minimal event for testing',
      location: 'Test Venue'
    });
  }

  /**
   * Create a "real" event with realistic data
   */
  static async createRealEvent(organizerId: string, index: number = 1): Promise<string> {
    const eventTypes = [
      { title: 'Tech Conference 2024', desc: 'Annual technology conference', loc: 'Bangalore International Convention Centre' },
      { title: 'Music Festival', desc: 'Live music and entertainment', loc: 'Mumbai Arena' },
      { title: 'Business Summit', desc: 'Leadership and innovation summit', loc: 'Delhi Convention Center' },
      { title: 'Sports Tournament', desc: 'Inter-city sports competition', loc: 'Chennai Stadium' }
    ];

    const event = eventTypes[index % eventTypes.length];
    return this.createEvent(organizerId, {
      title: event.title,
      description: event.desc,
      location: event.loc,
      startDate: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000), // Future dates
      endDate: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED'
    });
  }

  /**
   * Create a ticket category entity
   * @param eventId - Required foreign key
   * @param options - Override default values
   * @returns Ticket Category ID
   */
  static async createTicketCategory(
    eventId: string,
    options: TicketCategoryFactoryOptions = {}
  ): Promise<string> {
    const ticketCategoryId = options.id || uuidv4();

    const ticketData = {
      id: ticketCategoryId,
      event_id: eventId,
      name: options.name || 'General Admission',
      description: options.description || 'Standard ticket',
      price: options.price || 1000, // ₹10.00
      quantity: options.quantity || 100,
      max_per_order: options.maxPerOrder || 4,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options.customFields
    };

    await db('ticket_categories').insert(ticketData);
    return ticketCategoryId;
  }

  /**
   * Create multiple ticket categories for an event
   */
  static async createTicketCategories(eventId: string): Promise<string[]> {
    const categories = [
      { name: 'VIP', price: 5000, quantity: 20 },
      { name: 'General Admission', price: 1000, quantity: 100 },
      { name: 'Student', price: 500, quantity: 50 }
    ];

    const ids: string[] = [];
    for (const cat of categories) {
      const id = await this.createTicketCategory(eventId, cat);
      ids.push(id);
    }
    return ids;
  }

  /**
   * Create a booking entity
   * @param userId - Required foreign key
   * @param eventId - Required foreign key
   * @param ticketCategoryId - Required foreign key
   * @param options - Override default values
   * @returns Booking ID
   */
  static async createBooking(
    userId: string,
    eventId: string,
    ticketCategoryId: string,
    options: BookingFactoryOptions = {}
  ): Promise<string> {
    const bookingId = options.id || uuidv4();
    const quantity = options.quantity || 2;
    const totalPrice = options.totalPrice || (quantity * 1000);

    const bookingData = {
      id: bookingId,
      event_id: eventId,
      user_id: userId,
      ticket_category_id: ticketCategoryId,
      quantity,
      total_price: totalPrice,
      status: options.status || 'pending',
      booking_date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options.customFields
    };

    await db('bookings').insert(bookingData);
    return bookingId;
  }

  /**
   * Create a payment entity
   * @param bookingId - Required foreign key
   * @param options - Override default values
   * @returns Payment ID
   */
  static async createPayment(
    bookingId: string,
    options: PaymentFactoryOptions = {}
  ): Promise<string> {
    const paymentId = options.id || uuidv4();

    const paymentData = {
      id: paymentId,
      booking_id: bookingId,
      amount: options.amount || 2000,
      currency: options.currency || 'INR',
      status: options.status || 'pending',
      payment_method: options.paymentMethod || 'upi',
      utr_number: options.utrNumber || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options.customFields
    };

    await db('payments').insert(paymentData);
    return paymentId;
  }

  /**
   * Create a complete test scenario with all dependencies
   * @returns Object with all created IDs
   */
  static async createCompleteScenario() {
    const userId = await this.createUser();
    const organizerId = await this.createOrganizer();
    const eventId = await this.createEvent(organizerId);
    const ticketCategoryId = await this.createTicketCategory(eventId);
    const bookingId = await this.createBooking(userId, eventId, ticketCategoryId);
    const paymentId = await this.createPayment(bookingId);

    return {
      userId,
      organizerId,
      eventId,
      ticketCategoryId,
      bookingId,
      paymentId
    };
  }

  /**
   * Create a realistic scenario with multiple entities
   */
  static async createRealisticScenario() {
    // Create users
    const organizer = await this.createRealUser(1);
    const user1 = await this.createRealUser(2);
    const user2 = await this.createRealUser(3);
    const admin = await this.createAdmin({ email: 'admin@company.com', name: 'Admin User' });

    // Create event
    const event = await this.createRealEvent(organizer, 0);

    // Create ticket categories
    const ticketCategories = await this.createTicketCategories(event);

    // Create bookings
    const booking1 = await this.createBooking(user1, event, ticketCategories[1], { quantity: 2 });
    const booking2 = await this.createBooking(user2, event, ticketCategories[0], { quantity: 1, totalPrice: 5000 });

    // Create payments
    const payment1 = await this.createPayment(booking1, { status: 'verified' });
    const payment2 = await this.createPayment(booking2, { status: 'pending' });

    return {
      users: { organizer, user1, user2, admin },
      event,
      ticketCategories,
      bookings: { booking1, booking2 },
      payments: { payment1, payment2 }
    };
  }

  /**
   * Clean up all test data (call in afterEach)
   */
  static async cleanup() {
    // Delete in reverse dependency order
    await db('payments').del();
    await db('bookings').del();
    await db('ticket_categories').del();
    await db('events').del();
    await db('users').del();
  }
}
