import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';

/**
 * Event data structure for mocking
 */
export interface EventMock {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  organizerId: string;
  ticketCategories?: TicketCategoryMock[];
  venue?: VenueMock;
  images?: {
    id: string;
    url: string;
    type: string;
  }[];
}

/**
 * Ticket category data structure
 */
export interface TicketCategoryMock {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  eventId: string;
}

/**
 * Venue data structure
 */
export interface VenueMock {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  seatingMap?: {
    id: string;
    name: string;
    rows: number;
    columns: number;
    seatMap: any[];
  };
}

/**
 * User data structure
 */
export interface UserMock {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Booking data structure
 */
export interface BookingMock {
  id: string;
  userId: string;
  eventId: string;
  status: string;
  totalAmount: number;
  tickets: {
    id: string;
    categoryId: string;
    seat?: string;
  }[];
  paymentStatus: string;
  createdAt: string;
}

/**
 * Sample mock data
 */
export const mockEvents: EventMock[] = [
  {
    id: '1',
    title: 'Summer Music Festival',
    description: 'Annual music festival featuring top artists',
    startDate: '2023-08-15T18:00:00.000Z',
    endDate: '2023-08-17T23:00:00.000Z',
    location: 'Central Park, New York',
    status: 'PUBLISHED',
    organizerId: 'org1',
    ticketCategories: [
      {
        id: 'tc1',
        name: 'General Admission',
        description: 'Standard entry ticket',
        price: 150,
        capacity: 5000,
        eventId: '1'
      },
      {
        id: 'tc2',
        name: 'VIP',
        description: 'VIP access with special amenities',
        price: 300,
        capacity: 500,
        eventId: '1'
      }
    ],
    images: [
      {
        id: 'img1',
        url: 'https://example.com/images/event1.jpg',
        type: 'cover'
      }
    ]
  },
  {
    id: '2',
    title: 'Tech Conference 2023',
    description: 'Leading technology conference with workshops',
    startDate: '2023-09-20T09:00:00.000Z',
    endDate: '2023-09-22T17:00:00.000Z',
    location: 'Convention Center, San Francisco',
    status: 'PUBLISHED',
    organizerId: 'org2',
    ticketCategories: [
      {
        id: 'tc3',
        name: 'Standard Pass',
        description: 'Access to all talks',
        price: 250,
        capacity: 2000,
        eventId: '2'
      },
      {
        id: 'tc4',
        name: 'Workshop Pass',
        description: 'Access to talks and workshops',
        price: 450,
        capacity: 800,
        eventId: '2'
      }
    ]
  }
];

export const mockUsers: UserMock[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'USER'
  },
  {
    id: 'user2',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN'
  }
];

export const mockBookings: BookingMock[] = [
  {
    id: 'booking1',
    userId: 'user1',
    eventId: '1',
    status: 'CONFIRMED',
    totalAmount: 150,
    tickets: [
      {
        id: 'ticket1',
        categoryId: 'tc1',
        seat: 'A1'
      }
    ],
    paymentStatus: 'PAID',
    createdAt: '2023-07-15T10:30:00.000Z'
  }
];

/**
 * Define API handlers for mocking HTTP requests
 */
export const handlers = [
  // Events API
  http.get('*/api/v1/events', async () => {
    await delay(200); // Simulate network delay
    return HttpResponse.json({
      status: 'success',
      data: {
        events: mockEvents,
        pagination: {
          total: mockEvents.length,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      }
    });
  }),

  http.get('*/api/v1/events/:id', async ({ params }) => {
    await delay(100);
    const { id } = params;
    const event = mockEvents.find(e => e.id === id);
    
    if (!event) {
      return new HttpResponse(
        JSON.stringify({
          status: 'error',
          message: 'Event not found',
          code: 'NOT_FOUND'
        }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      status: 'success',
      data: event
    });
  }),

  // Auth API
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    
    // Check credentials (simple validation for testing)
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        status: 'success',
        data: {
          token: 'mock-token-12345',
          user: mockUsers[0]
        }
      });
    }
    
    return new HttpResponse(
      JSON.stringify({
        status: 'error',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }),
      { status: 401 }
    );
  }),

  http.get('*/api/v1/auth/me', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(
        JSON.stringify({
          status: 'error',
          message: 'Unauthorized',
          code: 'UNAUTHORIZED'
        }),
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      status: 'success',
      data: mockUsers[0]
    });
  }),

  // Bookings API
  http.get('*/api/v1/bookings', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(
        JSON.stringify({
          status: 'error',
          message: 'Unauthorized',
          code: 'UNAUTHORIZED'
        }),
        { status: 401 }
      );
    }
    
    await delay(150);
    return HttpResponse.json({
      status: 'success',
      data: {
        bookings: mockBookings,
        pagination: {
          total: mockBookings.length,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      }
    });
  }),

  // Payments API
  http.post('*/api/v1/payments/initialize', async ({ request }) => {
    const body = await request.json();
    
    // Check for required fields
    if (!body.booking_id || !body.amount || !body.payment_method) {
      return new HttpResponse(
        JSON.stringify({
          status: 'error',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: [
            {
              path: 'booking_id',
              message: 'Booking ID is required'
            }
          ]
        }),
        { status: 400 }
      );
    }
    
    await delay(200);
    return HttpResponse.json({
      status: 'success',
      data: {
        payment_id: 'pay_123456',
        booking_id: body.booking_id,
        amount: body.amount,
        currency: body.currency || 'INR',
        status: 'PENDING',
        payment_method: body.payment_method,
        created_at: new Date().toISOString()
      }
    });
  })
];

/**
 * Setup MSW server for tests
 */
export const server = setupServer(...handlers);

/**
 * Helper function to initialize mock server before tests
 */
export const setupApiMocks = () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}; 