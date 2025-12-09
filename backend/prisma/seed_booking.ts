import { BookingStatus, Prisma, PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // 1. Get the test user
  const user = await prisma.user.findUnique({
    where: { email: 'user@eventia.com' }
  });

  if (!user) {
    console.error('Test user not found');
    return;
  }

  // 2. Get an event (or create one if none exists)
  let event = await prisma.event.findFirst();
  if (!event) {
    console.log('No event found, creating one...');
    event = await prisma.event.create({
      data: {
        title: 'Test IPL Match',
        description: 'CSK vs MI',
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        endDate: new Date(Date.now() + 90000000),
        location: 'Wankhede Stadium',
        imageUrl: '/ipl-bg.jpg',
        capacity: 1000,
        organizerId: user.id,
        status: 'PUBLISHED'
      }
    });

    // Create Ticket Category
    await prisma.ticketCategory.create({
      data: {
        name: 'Standard',
        price: new Prisma.Decimal(500),
        totalSeats: 1000,
        available: 1000,
        eventId: event.id
      }
    });
  }

  // 3. Create a booking
  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      eventId: event.id,
      quantity: 2,
      finalAmount: new Prisma.Decimal(1000),
      status: BookingStatus.PENDING,
      seats: { 'Standard': 2 }
    }
  });

  // 4. Create a payment with UTR
  const payment = await prisma.bookingPayment.create({
    data: {
      id: uuidv4(),
      bookingId: booking.id,
      amount: new Prisma.Decimal(1000),
      status: 'pending',
      utrNumber: '123456789012'
    }
  });

  console.log(`Seeded booking with ID: ${booking.id}`);
  console.log(`Seeded payment with ID: ${payment.id} and UTR: 123456789012`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
