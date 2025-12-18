/**
 * Comprehensive IPL 2026 Data Seed Script
 * Creates a complete dataset for the IPL Ticket Booking System including:
 * - 10 IPL Teams with branding
 * - 8 Major Venues with capacity
 * - 20 IPL Matches for initial testing
 * - Linked Event records for booking integration
 * - 5 Ticket Categories per event
 * - Sample seats with section distribution
 * - Admin and User accounts for testing
 */

import { EventStatus, MatchStatus, PrismaClient, SeatStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ============ IPL TEAMS DATA ============
const iplTeams = [
  {
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    homeCity: 'Chennai',
    primaryColor: '#FDB913',
    secondaryColor: '#1C1C1C',
    logoUrl: '/assets/teams/csk.png',
    foundedYear: 2008
  },
  {
    name: 'Mumbai Indians',
    shortName: 'MI',
    homeCity: 'Mumbai',
    primaryColor: '#004BA0',
    secondaryColor: '#D4AF37',
    logoUrl: '/assets/teams/mi.png',
    foundedYear: 2008
  },
  {
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    homeCity: 'Bengaluru',
    primaryColor: '#EC1C24',
    secondaryColor: '#000000',
    logoUrl: '/assets/teams/rcb.png',
    foundedYear: 2008
  },
  {
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    homeCity: 'Kolkata',
    primaryColor: '#3A225D',
    secondaryColor: '#FFD700',
    logoUrl: '/assets/teams/kkr.png',
    foundedYear: 2008
  },
  {
    name: 'Delhi Capitals',
    shortName: 'DC',
    homeCity: 'Delhi',
    primaryColor: '#0078BC',
    secondaryColor: '#EF1C25',
    logoUrl: '/assets/teams/dc.png',
    foundedYear: 2008
  },
  {
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    homeCity: 'Hyderabad',
    primaryColor: '#FF822A',
    secondaryColor: '#000000',
    logoUrl: '/assets/teams/srh.png',
    foundedYear: 2013
  },
  {
    name: 'Punjab Kings',
    shortName: 'PBKS',
    homeCity: 'Mohali',
    primaryColor: '#ED1B24',
    secondaryColor: '#A7A9AC',
    logoUrl: '/assets/teams/pbks.png',
    foundedYear: 2008
  },
  {
    name: 'Rajasthan Royals',
    shortName: 'RR',
    homeCity: 'Jaipur',
    primaryColor: '#EA1A85',
    secondaryColor: '#254AA5',
    logoUrl: '/assets/teams/rr.png',
    foundedYear: 2008
  },
  {
    name: 'Gujarat Titans',
    shortName: 'GT',
    homeCity: 'Ahmedabad',
    primaryColor: '#1C1C1C',
    secondaryColor: '#B09862',
    logoUrl: '/assets/teams/gt.png',
    foundedYear: 2022
  },
  {
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    homeCity: 'Lucknow',
    primaryColor: '#ACE5EE',
    secondaryColor: '#A72056',
    logoUrl: '/assets/teams/lsg.png',
    foundedYear: 2022
  }
];

// ============ IPL VENUES DATA ============
const iplVenues = [
  {
    name: 'M. A. Chidambaram Stadium',
    shortName: 'Chepauk',
    city: 'Chennai',
    state: 'Tamil Nadu',
    capacity: 50000,
    imageUrl: '/assets/venues/chepauk.jpg',
    address: 'Victoria Hostel Road, Chepauk, Chennai'
  },
  {
    name: 'Wankhede Stadium',
    shortName: 'Wankhede',
    city: 'Mumbai',
    state: 'Maharashtra',
    capacity: 33000,
    imageUrl: '/assets/venues/wankhede.jpg',
    address: 'D Road, Churchgate, Mumbai'
  },
  {
    name: 'M. Chinnaswamy Stadium',
    shortName: 'Chinnaswamy',
    city: 'Bengaluru',
    state: 'Karnataka',
    capacity: 40000,
    imageUrl: '/assets/venues/chinnaswamy.jpg',
    address: 'MG Road, Bengaluru'
  },
  {
    name: 'Eden Gardens',
    shortName: 'Eden Gardens',
    city: 'Kolkata',
    state: 'West Bengal',
    capacity: 68000,
    imageUrl: '/assets/venues/eden.jpg',
    address: 'BBD Bagh, Kolkata'
  },
  {
    name: 'Arun Jaitley Stadium',
    shortName: 'Feroz Shah Kotla',
    city: 'Delhi',
    state: 'Delhi',
    capacity: 41000,
    imageUrl: '/assets/venues/kotla.jpg',
    address: 'Bahadur Shah Zafar Marg, New Delhi'
  },
  {
    name: 'Rajiv Gandhi International Cricket Stadium',
    shortName: 'Uppal Stadium',
    city: 'Hyderabad',
    state: 'Telangana',
    capacity: 55000,
    imageUrl: '/assets/venues/uppal.jpg',
    address: 'Uppal, Hyderabad'
  },
  {
    name: 'Narendra Modi Stadium',
    shortName: 'Motera',
    city: 'Ahmedabad',
    state: 'Gujarat',
    capacity: 132000,
    imageUrl: '/assets/venues/motera.jpg',
    address: 'Motera, Ahmedabad'
  },
  {
    name: 'Sawai Mansingh Stadium',
    shortName: 'SMS Stadium',
    city: 'Jaipur',
    state: 'Rajasthan',
    capacity: 30000,
    imageUrl: '/assets/venues/sms.jpg',
    address: 'Lal Kothi, Jaipur'
  }
];

// ============ TICKET CATEGORIES ============
const ticketCategoryTemplates = [
  { name: 'South Stand', description: 'Great view, behind the bowler arm', basePriceMultiplier: 1.0 },
  { name: 'North Stand', description: 'Excellent sightlines, lively atmosphere', basePriceMultiplier: 1.0 },
  { name: 'East Pavilion', description: 'Premium covered seating', basePriceMultiplier: 1.5 },
  { name: 'West Pavilion', description: 'Premium covered seating with shade', basePriceMultiplier: 1.5 },
  { name: 'VIP Box', description: 'Luxury experience with hospitality', basePriceMultiplier: 3.0 }
];

// Base prices per venue (some venues are more expensive)
const venuePricing: Record<string, number> = {
  'Chennai': 800,
  'Mumbai': 1000,
  'Bengaluru': 900,
  'Kolkata': 700,
  'Delhi': 850,
  'Hyderabad': 750,
  'Ahmedabad': 650,
  'Jaipur': 600
};

// ============ SAMPLE MATCHES ============
const sampleMatches = [
  { homeTeam: 'KKR', awayTeam: 'CSK', venue: 'Kolkata', date: '2026-03-21', time: '7:30 PM IST' },
  { homeTeam: 'MI', awayTeam: 'RCB', venue: 'Mumbai', date: '2026-03-22', time: '7:30 PM IST' },
  { homeTeam: 'DC', awayTeam: 'SRH', venue: 'Delhi', date: '2026-03-23', time: '7:30 PM IST' },
  { homeTeam: 'GT', awayTeam: 'PBKS', venue: 'Ahmedabad', date: '2026-03-24', time: '7:30 PM IST' },
  { homeTeam: 'RR', awayTeam: 'LSG', venue: 'Jaipur', date: '2026-03-25', time: '7:30 PM IST' },
  { homeTeam: 'CSK', awayTeam: 'MI', venue: 'Chennai', date: '2026-03-26', time: '7:30 PM IST' },
  { homeTeam: 'RCB', awayTeam: 'KKR', venue: 'Bengaluru', date: '2026-03-27', time: '7:30 PM IST' },
  { homeTeam: 'SRH', awayTeam: 'GT', venue: 'Hyderabad', date: '2026-03-28', time: '7:30 PM IST' },
  { homeTeam: 'PBKS', awayTeam: 'DC', venue: 'Jaipur', date: '2026-03-29', time: '3:30 PM IST' },
  { homeTeam: 'LSG', awayTeam: 'RR', venue: 'Delhi', date: '2026-03-29', time: '7:30 PM IST' },
  { homeTeam: 'MI', awayTeam: 'CSK', venue: 'Mumbai', date: '2026-03-30', time: '7:30 PM IST' },
  { homeTeam: 'KKR', awayTeam: 'RCB', venue: 'Kolkata', date: '2026-03-31', time: '7:30 PM IST' },
  { homeTeam: 'DC', awayTeam: 'GT', venue: 'Delhi', date: '2026-04-01', time: '7:30 PM IST' },
  { homeTeam: 'SRH', awayTeam: 'PBKS', venue: 'Hyderabad', date: '2026-04-02', time: '7:30 PM IST' },
  { homeTeam: 'RR', awayTeam: 'MI', venue: 'Jaipur', date: '2026-04-03', time: '7:30 PM IST' },
  { homeTeam: 'CSK', awayTeam: 'KKR', venue: 'Chennai', date: '2026-04-04', time: '7:30 PM IST' },
  { homeTeam: 'RCB', awayTeam: 'SRH', venue: 'Bengaluru', date: '2026-04-05', time: '7:30 PM IST' },
  { homeTeam: 'GT', awayTeam: 'LSG', venue: 'Ahmedabad', date: '2026-04-06', time: '7:30 PM IST' },
  { homeTeam: 'PBKS', awayTeam: 'RR', venue: 'Jaipur', date: '2026-04-07', time: '3:30 PM IST' },
  { homeTeam: 'DC', awayTeam: 'MI', venue: 'Delhi', date: '2026-04-07', time: '7:30 PM IST' }
];

// ============ HELPER FUNCTIONS ============
function getSeatsPerCategory(venueCapacity: number): number {
  // Each category gets roughly 1/5 of total capacity
  return Math.floor(venueCapacity / 5);
}

function generateSeatsForCategory(
  eventId: string,
  categoryId: string,
  categoryName: string,
  seatCount: number
): any[] {
  const seats = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seatsPerRow = Math.ceil(seatCount / rows.length);

  let seatNumber = 1;
  for (const row of rows) {
    for (let i = 1; i <= seatsPerRow && seatNumber <= seatCount; i++) {
      seats.push({
        id: uuidv4(),
        label: `${categoryName}-${row}${i}`,
        row: row,
        seatNumber: i.toString(),
        section: categoryName,
        type: 'standard',
        status: SeatStatus.AVAILABLE,
        eventId: eventId,
        ticketCategoryId: categoryId,
        meta: JSON.stringify({ row, number: i }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      seatNumber++;
    }
    if (seatNumber > seatCount) break;
  }

  return seats;
}

// ============ MAIN SEED FUNCTION ============
async function seedIplComplete() {
  console.log('🏏 Starting Comprehensive IPL 2026 Data Seed...\n');

  // Clean up existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning up existing IPL data...');
  await prisma.waitlistEntry.deleteMany({});
  await prisma.bookedSeat.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.bookingPayment.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.eventSummary.deleteMany({});
  await prisma.ticketCategory.deleteMany({});
  await prisma.iplMatch.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.iplTeam.deleteMany({});
  await prisma.iplVenue.deleteMany({});
  console.log('  ✓ Cleaned up existing data\n');

  // ============ CREATE VENUES ============
  console.log('📍 Creating IPL Venues...');
  const createdVenues: Record<string, string> = {};

  for (const venue of iplVenues) {
    const created = await prisma.iplVenue.create({
      data: venue
    });
    createdVenues[venue.city] = created.id;
    console.log(`  ✓ ${venue.name} (${venue.city})`);
  }
  console.log('');

  // ============ CREATE TEAMS ============
  console.log('🏏 Creating IPL Teams...');
  const createdTeams: Record<string, string> = {};

  for (const team of iplTeams) {
    const venueId = createdVenues[team.homeCity] || null;
    const created = await prisma.iplTeam.create({
      data: {
        ...team,
        homeVenueId: venueId
      }
    });
    createdTeams[team.shortName] = created.id;
    console.log(`  ✓ ${team.name} (${team.shortName})`);
  }
  console.log('');

  // ============ CREATE ADMIN USER ============
  console.log('👤 Creating Admin User...');
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@eventia.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@eventia.com',
      name: 'System Admin',
      password: adminPassword,
      role: UserRole.ADMIN,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  console.log(`  ✓ Admin: admin@eventia.com / Admin@123`);

  // ============ CREATE SAMPLE USER ============
  console.log('👤 Creating Sample User...');
  const userPassword = await bcrypt.hash('User@123', 12);
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'user@example.com',
      name: 'Test User',
      password: userPassword,
      role: UserRole.USER,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  console.log(`  ✓ User: user@example.com / User@123\n`);

  // ============ CREATE MATCHES WITH EVENTS ============
  console.log('🎯 Creating IPL Matches with Events...');
  let matchNumber = 1;

  for (const match of sampleMatches) {
    const matchId = uuidv4();
    const eventId = uuidv4();
    const venueId = createdVenues[match.venue];
    const homeTeamId = createdTeams[match.homeTeam];
    const awayTeamId = createdTeams[match.awayTeam];
    const homeTeam = iplTeams.find(t => t.shortName === match.homeTeam);
    const awayTeam = iplTeams.find(t => t.shortName === match.awayTeam);
    const venueData = iplVenues.find(v => v.city === match.venue);

    const matchDate = new Date(match.date);
    const endDate = new Date(matchDate);
    endDate.setHours(endDate.getHours() + 4); // Match duration ~4 hours

    // Calculate price multiplier for high-demand matches
    const isHighDemand = ['CSK', 'MI', 'RCB'].includes(match.homeTeam) ||
                         ['CSK', 'MI', 'RCB'].includes(match.awayTeam);
    const priceMultiplier = isHighDemand ? 1.5 : 1.0;

    // Create the Event first
    const event = await prisma.event.create({
      data: {
        id: eventId,
        title: `${homeTeam?.name} vs ${awayTeam?.name}`,
        description: `IPL 2026 Match ${matchNumber}: ${homeTeam?.name} takes on ${awayTeam?.name} at ${venueData?.name}. Don't miss this thrilling encounter!`,
        startDate: matchDate,
        endDate: endDate,
        location: venueData?.name || match.venue,
        status: EventStatus.PUBLISHED,
        capacity: venueData?.capacity || 40000,
        imageUrl: venueData?.imageUrl || '/assets/venues/default.jpg',
        organizerId: adminUser.id,
        createdBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create ticket categories for this event
    const basePrice = venuePricing[match.venue] || 700;
    const createdCategories: Array<{ id: string; name: string; price: number }> = [];
    const seatsPerCat = getSeatsPerCategory(venueData?.capacity || 40000);

    for (const template of ticketCategoryTemplates) {
      const categoryId = uuidv4();
      const price = Math.round(basePrice * template.basePriceMultiplier * priceMultiplier);

      await prisma.ticketCategory.create({
        data: {
          id: categoryId,
          name: template.name,
          description: template.description,
          price: price,
          totalSeats: seatsPerCat,
          bookedSeats: 0,
          capacity: seatsPerCat,
          available: seatsPerCat,
          eventId: eventId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      createdCategories.push({ id: categoryId, name: template.name, price });
    }

    // Create sample seats (limited to 100 per category for performance)
    const sampleSeatCount = Math.min(100, seatsPerCat);
    for (const cat of createdCategories) {
      const seats = generateSeatsForCategory(eventId, cat.id, cat.name, sampleSeatCount);
      await prisma.seat.createMany({
        data: seats
      });
    }

    // Create EventSummary
    const prices = createdCategories.map(c => c.price);
    await prisma.eventSummary.create({
      data: {
        id: uuidv4(),
        eventId: eventId,
        totalSeats: venueData?.capacity || 40000,
        bookedSeats: 0,
        availableSeats: venueData?.capacity || 40000,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create the IplMatch linked to the Event
    await prisma.iplMatch.create({
      data: {
        id: matchId,
        matchNumber: matchNumber,
        homeTeamId: homeTeamId,
        awayTeamId: awayTeamId,
        venueId: venueId,
        matchDate: matchDate,
        matchTime: match.time,
        status: MatchStatus.UPCOMING,
        eventId: eventId,
        priceMultiplier: priceMultiplier,
        isPlayoff: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`  ✓ Match ${matchNumber}: ${match.homeTeam} vs ${match.awayTeam} (${match.date})`);
    matchNumber++;
  }

  console.log('\n✅ IPL 2026 Data Seed Completed Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  📍 Venues:    ${iplVenues.length}`);
  console.log(`  🏏 Teams:     ${iplTeams.length}`);
  console.log(`  🎯 Matches:   ${sampleMatches.length}`);
  console.log(`  🎫 Events:    ${sampleMatches.length}`);
  console.log(`  🎟️  Categories: ${sampleMatches.length * ticketCategoryTemplates.length}`);
  console.log(`  👤 Users:     2 (admin + sample user)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔐 Login Credentials:');
  console.log('  Admin: admin@eventia.com / Admin@123');
  console.log('  User:  user@example.com / User@123\n');
}

// Run the seed
seedIplComplete()
  .catch((e) => {
    console.error('❌ Error seeding IPL data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
