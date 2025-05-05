import { EventStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

/**
 * Factory for generating test event data
 * This provides a reusable way to create test events with consistent data structure
 */
export class EventFactory {
  /**
   * Create a basic event with required fields
   */
  static createBasic(overrides: Record<string, any> = {}) {
    return {
      id: faker.string.uuid(),
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      location: faker.location.streetAddress(),
      startDate: faker.date.future({years: 1}),
      endDate: faker.date.future({years: 1, refDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}),
      status: EventStatus.DRAFT,
      organizerId: faker.string.uuid(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      isDeleted: false,
      ...overrides
    };
  }

  /**
   * Create a published event
   */
  static createPublished(overrides: Record<string, any> = {}) {
    return this.createBasic({
      status: EventStatus.PUBLISHED,
      ...overrides
    });
  }

  /**
   * Create an event with ticket categories
   */
  static createWithTickets(ticketCount = 2, overrides: Record<string, any> = {}) {
    const ticketCategories = Array.from({ length: ticketCount }, (_, i) => ({
      id: faker.string.uuid(),
      name: `${faker.commerce.productAdjective()} Ticket ${i + 1}`,
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      capacity: faker.number.int({ min: 10, max: 1000 }),
      eventId: overrides.id || faker.string.uuid(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      isDeleted: false
    }));

    return this.createBasic({
      ticketCategories,
      ...overrides
    });
  }

  /**
   * Create a full event with all relationships
   */
  static createComplete(overrides: Record<string, any> = {}) {
    // Create ticket categories
    const ticketCategories = Array.from({ length: 3 }, (_, i) => ({
      id: faker.string.uuid(),
      name: `${faker.commerce.productAdjective()} Ticket ${i + 1}`,
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      capacity: faker.number.int({ min: 10, max: 1000 }),
      eventId: overrides.id || faker.string.uuid(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent()
    }));

    // Create venue with seating map
    const seatingMap = {
      id: faker.string.uuid(),
      name: `${faker.commerce.productName()} Venue`,
      rows: faker.number.int({ min: 5, max: 20 }),
      columns: faker.number.int({ min: 5, max: 20 }),
      seatMap: Array.from({ length: 10 }, () => ({
        row: faker.string.alpha({ length: 1, casing: 'upper' }),
        seats: Array.from({ length: 10 }, () => ({
          id: faker.string.uuid(),
          number: faker.number.int({ min: 1, max: 100 }),
          status: 'available',
          categoryId: ticketCategories[faker.number.int({ min: 0, max: 2 })].id
        }))
      }))
    };

    // Create organizer
    const organizer = {
      id: faker.string.uuid(),
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent()
    };

    return this.createPublished({
      ticketCategories,
      venue: {
        id: faker.string.uuid(),
        name: `${faker.commerce.productName()} Venue`,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        seatingMap
      },
      images: Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        url: faker.image.url(),
        type: 'event_image',
        eventId: overrides.id || faker.string.uuid()
      })),
      organizer,
      tags: Array.from({ length: 4 }, () => faker.commerce.department()),
      ...overrides
    });
  }

  /**
   * Create an array of events
   */
  static createMany(count = 5, factory = this.createBasic, overrides: Record<string, any> = {}) {
    return Array.from({ length: count }, (_, index) => 
      factory({
        id: faker.string.uuid(),
        ...overrides
      })
    );
  }
} 