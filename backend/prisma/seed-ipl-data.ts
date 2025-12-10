import { MatchStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// IPL 2026 Teams
const iplTeams = [
  {
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    homeCity: 'Chennai',
    primaryColor: '#FDB913',
    secondaryColor: '#1C1C1C',
    logoUrl: '/teams/csk.png',
    foundedYear: 2008
  },
  {
    name: 'Mumbai Indians',
    shortName: 'MI',
    homeCity: 'Mumbai',
    primaryColor: '#004BA0',
    secondaryColor: '#D4AF37',
    logoUrl: '/teams/mi.png',
    foundedYear: 2008
  },
  {
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    homeCity: 'Bengaluru',
    primaryColor: '#EC1C24',
    secondaryColor: '#000000',
    logoUrl: '/teams/rcb.png',
    foundedYear: 2008
  },
  {
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    homeCity: 'Kolkata',
    primaryColor: '#3A225D',
    secondaryColor: '#FFD700',
    logoUrl: '/teams/kkr.png',
    foundedYear: 2008
  },
  {
    name: 'Delhi Capitals',
    shortName: 'DC',
    homeCity: 'Delhi',
    primaryColor: '#0078BC',
    secondaryColor: '#EF1C25',
    logoUrl: '/teams/dc.png',
    foundedYear: 2008
  },
  {
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    homeCity: 'Hyderabad',
    primaryColor: '#FF822A',
    secondaryColor: '#000000',
    logoUrl: '/teams/srh.png',
    foundedYear: 2013
  },
  {
    name: 'Punjab Kings',
    shortName: 'PBKS',
    homeCity: 'Mohali',
    primaryColor: '#ED1B24',
    secondaryColor: '#A7A9AC',
    logoUrl: '/teams/pbks.png',
    foundedYear: 2008
  },
  {
    name: 'Rajasthan Royals',
    shortName: 'RR',
    homeCity: 'Jaipur',
    primaryColor: '#EA1A85',
    secondaryColor: '#254AA5',
    logoUrl: '/teams/rr.png',
    foundedYear: 2008
  },
  {
    name: 'Gujarat Titans',
    shortName: 'GT',
    homeCity: 'Ahmedabad',
    primaryColor: '#1C1C1C',
    secondaryColor: '#B09862',
    logoUrl: '/teams/gt.png',
    foundedYear: 2022
  },
  {
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    homeCity: 'Lucknow',
    primaryColor: '#ACE5EE',
    secondaryColor: '#A72056',
    logoUrl: '/teams/lsg.png',
    foundedYear: 2022
  }
];

// IPL Venues
const iplVenues = [
  {
    name: 'M. A. Chidambaram Stadium',
    shortName: 'Chepauk',
    city: 'Chennai',
    state: 'Tamil Nadu',
    capacity: 50000,
    imageUrl: '/venues/chepauk.jpg'
  },
  {
    name: 'Wankhede Stadium',
    shortName: 'Wankhede',
    city: 'Mumbai',
    state: 'Maharashtra',
    capacity: 33000,
    imageUrl: '/venues/wankhede.jpg'
  },
  {
    name: 'M. Chinnaswamy Stadium',
    shortName: 'Chinnaswamy',
    city: 'Bengaluru',
    state: 'Karnataka',
    capacity: 40000,
    imageUrl: '/venues/chinnaswamy.jpg'
  },
  {
    name: 'Eden Gardens',
    shortName: 'Eden Gardens',
    city: 'Kolkata',
    state: 'West Bengal',
    capacity: 68000,
    imageUrl: '/venues/eden.jpg'
  },
  {
    name: 'Arun Jaitley Stadium',
    shortName: 'Feroz Shah Kotla',
    city: 'Delhi',
    state: 'Delhi',
    capacity: 41000,
    imageUrl: '/venues/kotla.jpg'
  },
  {
    name: 'Rajiv Gandhi International Cricket Stadium',
    shortName: 'Uppal Stadium',
    city: 'Hyderabad',
    state: 'Telangana',
    capacity: 55000,
    imageUrl: '/venues/uppal.jpg'
  },
  {
    name: 'Narendra Modi Stadium',
    shortName: 'Motera',
    city: 'Ahmedabad',
    state: 'Gujarat',
    capacity: 132000,
    imageUrl: '/venues/motera.jpg'
  },
  {
    name: 'Sawai Mansingh Stadium',
    shortName: 'SMS Stadium',
    city: 'Jaipur',
    state: 'Rajasthan',
    capacity: 30000,
    imageUrl: '/venues/sms.jpg'
  }
];

async function seedIplData() {
  console.log('🏏 Starting IPL 2026 data seed...');

  // Create venues first
  console.log('📍 Creating IPL venues...');
  const createdVenues: Record<string, string> = {};

  for (const venue of iplVenues) {
    const created = await prisma.iplVenue.upsert({
      where: { id: venue.city }, // Using city as unique identifier for upsert
      update: venue,
      create: venue
    });
    createdVenues[venue.city] = created.id;
    console.log(`  ✓ Created venue: ${venue.name}`);
  }

  // Create teams with home venues
  console.log('🏏 Creating IPL teams...');
  const createdTeams: Record<string, string> = {};

  for (const team of iplTeams) {
    const venueId = createdVenues[team.homeCity] || null;
    const created = await prisma.iplTeam.upsert({
      where: { shortName: team.shortName },
      update: { ...team, homeVenueId: venueId },
      create: { ...team, homeVenueId: venueId }
    });
    createdTeams[team.shortName] = created.id;
    console.log(`  ✓ Created team: ${team.name} (${team.shortName})`);
  }

  // Create sample IPL 2026 matches (first 10 matches)
  console.log('🎯 Creating sample IPL 2026 matches...');
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
    { homeTeam: 'LSG', awayTeam: 'RR', venue: 'Delhi', date: '2026-03-29', time: '7:30 PM IST' }
  ];

  let matchNumber = 1;
  for (const match of sampleMatches) {
    await prisma.iplMatch.create({
      data: {
        matchNumber: matchNumber++,
        homeTeamId: createdTeams[match.homeTeam],
        awayTeamId: createdTeams[match.awayTeam],
        venueId: createdVenues[match.venue],
        matchDate: new Date(match.date),
        matchTime: match.time,
        status: MatchStatus.UPCOMING,
        priceMultiplier: match.homeTeam === 'CSK' || match.awayTeam === 'MI' ? 1.5 : 1.0,
        isPlayoff: false
      }
    });
    console.log(`  ✓ Created Match ${matchNumber - 1}: ${match.homeTeam} vs ${match.awayTeam}`);
  }

  console.log('✅ IPL 2026 data seed completed!');
  console.log(`   - ${iplTeams.length} teams created`);
  console.log(`   - ${iplVenues.length} venues created`);
  console.log(`   - ${sampleMatches.length} matches created`);
}

// Run the seed
seedIplData()
  .catch((e) => {
    console.error('❌ Error seeding IPL data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
