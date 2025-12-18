import { BookingStatus, EventStatus, PaymentStatus, UserRole } from '@prisma/client';
import { prisma } from '../src/db/prisma';

async function main() {
  console.log('Starting database seed...');

  // Clean up existing data
  await prisma.ticketGenerationQueue.deleteMany({});
  await prisma.reservationExpiryQueue.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.bookingPayment.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.deliveryDetails.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.discount.deleteMany({});
  await prisma.ticketCategory.deleteMany({});
  await prisma.upiSettings.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Music'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Sports'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Arts & Theatre'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Festivals'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Cricket'
      }
    }),
    prisma.category.create({
      data: {
        name: 'IPL'
      }
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  // Create UPI settings
  const upiSetting = await prisma.upiSettings.create({
    data: {
      upivpa: 'eventia@upi',
      discountamount: 50,
      isactive: true
    }
  });

  console.log(`Created UPI setting: ${upiSetting.upivpa}`);

  // Create an admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@eventia.com',
      name: 'Admin User',
      password: '$2b$10$fcQbrljkPZFtSzjlaEG81u5AGULpUKkjTtIbQb/PoQlx2wne8NZea', // hashed 'password123'
      role: UserRole.ADMIN,
      verified: true
    }
  });

  // Create a regular user
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Regular User',
      password: '$2b$10$fcQbrljkPZFtSzjlaEG81u5AGULpUKkjTtIbQb/PoQlx2wne8NZea', // hashed 'password123'
      role: UserRole.USER,
      verified: true
    }
  });

  console.log(`Created users: ${admin.email}, ${regularUser.email}`);

  // Create discount codes
  const discount = await prisma.discount.create({
    data: {
      code: 'WELCOME20',
      type: 'PERCENTAGE',
      value: 20,
      maxUses: 100,
      minAmount: 500,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      isActive: true,
      description: '20% off for new users'
    }
  });

  console.log(`Created discount code: ${discount.code}`);

  // Create some events
  const eventsData = [
    {
      title: 'Mumbai Music Festival 2025',
      description: 'Annual music festival featuring the best talent in India',
      startDate: new Date('2025-05-15T16:00:00'),
      endDate: new Date('2025-05-16T23:00:00'),
      location: 'Mumbai Stadium, Mumbai',
      organizerId: admin.id,
      status: EventStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?q=80&w=2340&auto=format&fit=crop',
      categories: {
        connect: [{ id: categories[0].id }] // Music
      }
    },
    {
      title: 'IPL 2025: Mumbai vs Delhi',
      description: 'Witness the clash of titans in this premier league match',
      startDate: new Date('2025-05-20T18:30:00'),
      endDate: new Date('2025-05-20T22:30:00'),
      location: 'Wankhede Stadium, Mumbai',
      organizerId: admin.id,
      status: EventStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2305&auto=format&fit=crop',
      categories: {
        connect: [
          { id: categories[4].id }, // Cricket
          { id: categories[5].id }  // IPL
        ]
      }
    },
    {
      title: 'IPL 2025: Chennai vs Kolkata',
      description: 'A classic rivalry under the lights',
      startDate: new Date('2025-05-21T19:30:00'),
      endDate: new Date('2025-05-21T23:00:00'),
      location: 'M.A. Chidambaram Stadium, Chennai',
      organizerId: admin.id,
      status: EventStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067&auto=format&fit=crop',
      categories: {
        connect: [
          { id: categories[4].id }, // Cricket
          { id: categories[5].id }  // IPL
        ]
      }
    },
    {
      title: 'IPL 2025: Bengaluru vs Hyderabad',
      description: 'High-scoring thriller expected at Chinnaswamy',
      startDate: new Date('2025-05-22T19:30:00'),
      endDate: new Date('2025-05-22T23:00:00'),
      location: 'M. Chinnaswamy Stadium, Bengaluru',
      organizerId: admin.id,
      status: EventStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2305&auto=format&fit=crop',
      categories: {
        connect: [
          { id: categories[4].id }, // Cricket
          { id: categories[5].id }  // IPL
        ]
      }
    },
    {
      title: 'Delhi Theatre Festival',
      description: 'A celebration of drama, theatre and performing arts',
      startDate: new Date('2025-06-10T15:00:00'),
      endDate: new Date('2025-06-12T22:00:00'),
      location: 'National Theatre, Delhi',
      organizerId: admin.id,
      status: EventStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=2071&auto=format&fit=crop',
      categories: {
        connect: [{ id: categories[2].id }] // Arts & Theatre
      }
    },
    {
      title: 'Bangalore Food Festival 2025',
      description: 'Experience culinary delights from across the country',
      startDate: new Date('2025-06-25T11:00:00'),
      endDate: new Date('2025-06-27T23:00:00'),
      location: 'Central Park, Bangalore',
      organizerId: admin.id,
      status: EventStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2187&auto=format&fit=crop',
      categories: {
        connect: [{ id: categories[3].id }] // Festivals
      }
    },
    {
      title: 'IPL 2025: Chennai vs Bangalore',
      description: 'Epic T20 cricket match between CSK and RCB',
      startDate: new Date('2025-05-25T19:00:00'),
      endDate: new Date('2025-05-25T23:00:00'),
      location: 'M.A. Chidambaram Stadium, Chennai',
      organizerId: admin.id,
      status: EventStatus.PUBLISHED,
      imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067&auto=format&fit=crop',
      categories: {
        connect: [
          { id: categories[4].id }, // Cricket
          { id: categories[5].id }  // IPL
        ]
      }
    }
  ];

  const createdEvents = [];

  // Create events with ticket categories and seats
  for (const eventData of eventsData) {
    const event = await prisma.event.create({
      data: eventData
    });
    createdEvents.push(event);

    // Create ticket categories for each event
    const generalCategory = await prisma.ticketCategory.create({
      data: {
        name: 'General Admission',
        description: 'Standard entry ticket',
        price: 799,
        totalSeats: 200,
        eventId: event.id
      }
    });

    const vipCategory = await prisma.ticketCategory.create({
      data: {
        name: 'VIP Access',
        description: 'Premium experience with special benefits',
        price: 1999,
        totalSeats: 50,
        eventId: event.id
      }
    });

    // Create seats for the event
    const sections = ['Main Floor', 'Balcony'];
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatsPerRow = 10;

    const seatPromises = [];

    // Main Floor seats (General)
    for (let r = 0; r < 2; r++) {
      for (let i = 1; i <= seatsPerRow; i++) {
        seatPromises.push(
          prisma.seat.create({
            data: {
              label: `${sections[0]}-${rows[r]}${i}`,
              section: sections[0],
              row: rows[r],
              seatNumber: i.toString(),
              price: generalCategory.price,
              eventId: event.id,
              ticketCategoryId: generalCategory.id
            }
          })
        );
      }
    }

    // Balcony seats (VIP)
    for (let r = 0; r < 1; r++) {
      for (let i = 1; i <= seatsPerRow; i++) {
        seatPromises.push(
          prisma.seat.create({
            data: {
              label: `${sections[1]}-${rows[r]}${i}`,
              section: sections[1],
              row: rows[r],
              seatNumber: i.toString(),
              price: vipCategory.price,
              eventId: event.id,
              ticketCategoryId: vipCategory.id
            }
          })
        );
      }
    }

    await Promise.all(seatPromises);
    console.log(`Created ${seatPromises.length} seats for ${event.title}`);
  }

  // Create a sample booking
  const booking = await prisma.booking.create({
    data: {
      userId: regularUser.id,
      eventId: createdEvents[0].id,
      status: BookingStatus.CONFIRMED,
      quantity: 2,
      finalAmount: 1598, // 2 x 799
      seats: JSON.stringify([
        { label: 'Main Floor-A1', section: 'Main Floor', row: 'A', seatNumber: '1' },
        { label: 'Main Floor-A2', section: 'Main Floor', row: 'A', seatNumber: '2' }
      ])
    }
  });

  // Create payment for the booking
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: booking.finalAmount,
      status: PaymentStatus.COMPLETED,
      method: 'UPI'
    }
  });

  // Create booking payment with UTR details
  await prisma.bookingPayment.create({
    data: {
      bookingId: booking.id,
      amount: booking.finalAmount,
      utrNumber: 'UTR123456789',
      paymentDate: new Date(),
      status: 'verified',
      verifiedBy: admin.id
    }
  });

  // Create delivery details for the booking
  await prisma.deliveryDetails.create({
    data: {
      bookingId: booking.id,
      name: regularUser.name,
      email: regularUser.email,
      phone: '9876543210',
      address: 'Sample Address, Mumbai, India'
    }
  });

  // Update the seat status to booked
  await prisma.seat.updateMany({
    where: {
      eventId: createdEvents[0].id,
      section: 'Main Floor',
      row: 'A',
      seatNumber: { in: ['1', '2'] }
    },
    data: {
      status: 'BOOKED'
    }
  });

  console.log(`Created sample booking with id: ${booking.id}`);
  console.log(`Created ${eventsData.length} events with ticket categories and seats`);
  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
