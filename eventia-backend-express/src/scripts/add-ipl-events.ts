import { EventStatus } from '@prisma/client';
import { prisma } from '../db/prisma';

async function addIplEvents() {
  console.log('Starting to add IPL events');

  // First, ensure we have cricket and IPL categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Cricket' },
      update: {},
      create: { name: 'Cricket' }
    }),
    prisma.category.upsert({
      where: { name: 'IPL' },
      update: {},
      create: { name: 'IPL' }
    })
  ]);

  console.log('Categories created/verified:', categories.map(c => c.name));

  // Get valid admin user ID first
  console.log('Looking for admin user...');
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  });

  if (!adminUser) {
    throw new Error('No admin user found. Please create an admin user first.');
  }

  console.log(`Found admin user: ${adminUser.name} (${adminUser.id})`);

  // Create sample IPL matches
  const iplMatches = [
    {
      title: 'Mumbai Indians vs Chennai Super Kings',
      description: 'Exciting IPL match between MI and CSK',
      startDate: new Date('2025-05-01T19:30:00'),
      endDate: new Date('2025-05-01T23:00:00'),
      location: 'Wankhede Stadium, Mumbai',
      status: EventStatus.PUBLISHED,
      categories: ['Cricket', 'IPL'],
      ticketCategories: [
        {
          name: 'General Stand',
          description: 'Standard seating with good view',
          price: 1000,
          totalSeats: 5000,
          bookedSeats: 0
        },
        {
          name: 'Premium Stand',
          description: 'Better viewing angle with comfortable seating',
          price: 3000,
          totalSeats: 2000,
          bookedSeats: 0
        },
        {
          name: 'VIP Box',
          description: 'Exclusive experience with the best views',
          price: 8000,
          totalSeats: 500,
          bookedSeats: 0
        }
      ]
    },
    {
      title: 'Royal Challengers Bangalore vs Delhi Capitals',
      description: 'T20 clash between RCB and DC',
      startDate: new Date('2025-05-05T19:30:00'),
      endDate: new Date('2025-05-05T23:00:00'),
      location: 'M. Chinnaswamy Stadium, Bangalore',
      status: EventStatus.PUBLISHED,
      categories: ['Cricket', 'IPL'],
      ticketCategories: [
        {
          name: 'General Stand',
          description: 'Standard seating with good view',
          price: 1200,
          totalSeats: 6000,
          bookedSeats: 0
        },
        {
          name: 'Premium Stand',
          description: 'Better viewing angle with comfortable seating',
          price: 3500,
          totalSeats: 2500,
          bookedSeats: 0
        },
        {
          name: 'VIP Box',
          description: 'Exclusive experience with the best views',
          price: 7500,
          totalSeats: 400,
          bookedSeats: 0
        }
      ]
    },
    {
      title: 'Kolkata Knight Riders vs Punjab Kings',
      description: 'T20 battle between KKR and PBKS',
      startDate: new Date('2025-05-08T19:30:00'),
      endDate: new Date('2025-05-08T23:00:00'),
      location: 'Eden Gardens, Kolkata',
      status: EventStatus.PUBLISHED,
      categories: ['Cricket', 'IPL'],
      ticketCategories: [
        {
          name: 'General Stand',
          description: 'Standard seating with good view',
          price: 900,
          totalSeats: 7000,
          bookedSeats: 0
        },
        {
          name: 'Premium Stand',
          description: 'Better viewing angle with comfortable seating',
          price: 2800,
          totalSeats: 3000,
          bookedSeats: 0
        },
        {
          name: 'VIP Box',
          description: 'Exclusive experience with the best views',
          price: 6500,
          totalSeats: 600,
          bookedSeats: 0
        }
      ]
    },
    {
      title: 'Rajasthan Royals vs Sunrisers Hyderabad',
      description: 'T20 showdown between RR and SRH',
      startDate: new Date('2025-05-12T19:30:00'),
      endDate: new Date('2025-05-12T23:00:00'),
      location: 'Sawai Mansingh Stadium, Jaipur',
      status: EventStatus.PUBLISHED,
      categories: ['Cricket', 'IPL'],
      ticketCategories: [
        {
          name: 'General Stand',
          description: 'Standard seating with good view',
          price: 800,
          totalSeats: 4500,
          bookedSeats: 0
        },
        {
          name: 'Premium Stand',
          description: 'Better viewing angle with comfortable seating',
          price: 2500,
          totalSeats: 2000,
          bookedSeats: 0
        },
        {
          name: 'VIP Box',
          description: 'Exclusive experience with the best views',
          price: 6000,
          totalSeats: 300,
          bookedSeats: 0
        }
      ]
    }
  ];

  // Add them to the database
  for (const match of iplMatches) {
    // Find category IDs
    const categoryIds = await Promise.all(
      match.categories.map(name =>
        prisma.category.findUnique({ where: { name } })
          .then(cat => cat?.id)
      )
    );

    const validCategoryIds = categoryIds.filter(Boolean);

    // Create event with categories
    const event = await prisma.event.create({
      data: {
        title: match.title,
        description: match.description,
        startDate: match.startDate,
        endDate: match.endDate,
        location: match.location,
        status: match.status,
        capacity: match.ticketCategories.reduce((sum, tc) => sum + tc.totalSeats, 0),
        organizerId: adminUser.id,
        categories: {
          connect: validCategoryIds.map(id => ({ id }))
        }
      }
    });

    console.log(`Created event: ${event.title}`);

    // Add ticket categories
    for (const tc of match.ticketCategories) {
      await prisma.ticketCategory.create({
        data: {
          name: tc.name,
          description: tc.description,
          price: tc.price,
          totalSeats: tc.totalSeats,
          bookedSeats: tc.bookedSeats,
          eventId: event.id
        }
      });
    }

    console.log(`Added ${match.ticketCategories.length} ticket categories to event: ${event.title}`);
  }

  console.log('Finished adding IPL events');
}

addIplEvents()
  .catch(e => {
    console.error('Error adding IPL events:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
