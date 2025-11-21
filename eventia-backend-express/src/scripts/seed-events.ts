/**
 * Event Seeding Script
 *
 * This script seeds realistic IPL event data into the database.
 * Run with: npx ts-node src/scripts/seed-events.ts
 */

import { EventStatus } from '@prisma/client';
import { prisma } from '../db/prisma';

interface IPLTeam {
    name: string;
    shortName: string;
    logo: string;
}

interface Venue {
    name: string;
    city: string;
}

// Create IPL teams with realistic data
const iplTeams: IPLTeam[] = [
    { name: 'Mumbai Indians', shortName: 'MI', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Medium/MI.png' },
    { name: 'Chennai Super Kings', shortName: 'CSK', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Medium/CSK.png' },
    { name: 'Royal Challengers Bangalore', shortName: 'RCB', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/Logos/Medium/RCB.png' },
    { name: 'Kolkata Knight Riders', shortName: 'KKR', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/Logos/Medium/KKR.png' },
    { name: 'Delhi Capitals', shortName: 'DC', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/DC/Logos/Medium/DC.png' },
    { name: 'Punjab Kings', shortName: 'PBKS', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/PBKS/Logos/Medium/PBKS.png' },
    { name: 'Sunrisers Hyderabad', shortName: 'SRH', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/SRH/Logos/Medium/SRH.png' },
    { name: 'Rajasthan Royals', shortName: 'RR', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RR/Logos/Medium/RR.png' },
    { name: 'Gujarat Titans', shortName: 'GT', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/GT/Logos/Medium/GT.png' },
    { name: 'Lucknow Super Giants', shortName: 'LSG', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/LSG/Logos/Medium/LSG.png' }
];

// Venues for IPL matches
const venues: Venue[] = [
    { name: 'Wankhede Stadium', city: 'Mumbai' },
    { name: 'M. A. Chidambaram Stadium', city: 'Chennai' },
    { name: 'Eden Gardens', city: 'Kolkata' },
    { name: 'M. Chinnaswamy Stadium', city: 'Bangalore' },
    { name: 'Arun Jaitley Stadium', city: 'Delhi' },
    { name: 'Rajiv Gandhi International Cricket Stadium', city: 'Hyderabad' }
];

// Create categories
async function createCricketCategory() {
    // Check if Cricket category exists
    const existingCategory = await prisma.category.findFirst({
        where: { name: 'Cricket' }
    });

    // If it doesn't exist, create it
    if (!existingCategory) {
        return prisma.category.create({
            data: {
                name: 'Cricket'
            }
        });
    }

    return existingCategory;
}

// Get admin user for organizing events
async function getAdminUser() {
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!admin) {
        throw new Error('No admin user found. Please create an admin user first.');
    }

    return admin;
}

// Generate IPL matches
async function generateIPLMatches() {
    try {
        // Get admin user
        const admin = await getAdminUser();

        // Create Cricket category if it doesn't exist
        const cricketCategory = await createCricketCategory();

        // Get current date for generating event dates
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + 2); // Start 2 days from now

        // Create 10 IPL matches
        const numberOfMatches = 10;
        const matchPromises = [];

        for (let i = 0; i < numberOfMatches; i++) {
            // Pick two random teams for each match
            const availableTeams = [...iplTeams];
            const teamIndex1 = Math.floor(Math.random() * availableTeams.length);
            const team1 = availableTeams.splice(teamIndex1, 1)[0];
            const teamIndex2 = Math.floor(Math.random() * availableTeams.length);
            const team2 = availableTeams.splice(teamIndex2, 1)[0];

            // Pick a random venue
            const venue = venues[Math.floor(Math.random() * venues.length)];

            // Generate match date (every 2 days)
            const matchDate = new Date(startDate);
            matchDate.setDate(startDate.getDate() + (i * 2));

            // Set evening time (7 or 8 PM)
            matchDate.setHours(19 + Math.floor(Math.random() * 2));
            matchDate.setMinutes(30);
            matchDate.setSeconds(0);
            matchDate.setMilliseconds(0);

            // End date (4 hours after start)
            const endDate = new Date(matchDate);
            endDate.setHours(endDate.getHours() + 4);

            // Match ID with timestamp to ensure uniqueness
            const matchId = `ipl-${i + 1}-${Date.now() + i}`;

            // Create event in database
            const matchPromise = prisma.event.create({
                data: {
                    id: matchId,
                    title: `${team1.name} vs ${team2.name}`,
                    description: `Watch an exciting IPL match between ${team1.name} and ${team2.name} at ${venue.name}, ${venue.city}. Don't miss this thrilling encounter between two of the best teams in IPL.`,
                    startDate: matchDate,
                    endDate: endDate,
                    location: `${venue.name}, ${venue.city}`,
                    imageUrl: `https://example.com/ipl/${team1.shortName}_vs_${team2.shortName}.jpg`,
                    status: EventStatus.PUBLISHED,
                    capacity: 50000,
                    organizerId: admin.id,
                    // Add extended metadata as JSON
                    // Store teams info as a JSON field for frontend use
                    // Note: This assumes you've added a custom field to your model
                    // If you don't have a JSON field, you can store this in the description

                    // Create categories relation
                    categories: {
                        connect: [{
                            id: cricketCategory.id
                        }]
                    },

                    // Create ticket categories
                    ticketCategories: {
                        create: [
                            {
                                name: 'Premium',
                                description: 'Best seats with premium services',
                                price: 8000,
                                totalSeats: 5000,
                                bookedSeats: 0
                            },
                            {
                                name: 'Executive',
                                description: 'Great view with comfortable seating',
                                price: 5000,
                                totalSeats: 10000,
                                bookedSeats: 0
                            },
                            {
                                name: 'General',
                                description: 'Standard seating with good view',
                                price: 2500,
                                totalSeats: 20000,
                                bookedSeats: 0
                            },
                            {
                                name: 'Economy',
                                description: 'Budget-friendly seating option',
                                price: 1000,
                                totalSeats: 15000,
                                bookedSeats: 0
                            }
                        ]
                    }
                }
            });

            matchPromises.push(matchPromise);
            console.log(`Creating match: ${team1.name} vs ${team2.name} at ${venue.name}, ${venue.city} on ${matchDate.toLocaleDateString()}`);
        }

        // Wait for all matches to be created
        await Promise.all(matchPromises);
        console.log(`Successfully created ${numberOfMatches} IPL matches`);

    } catch (error) {
        console.error('Error seeding events:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the function
generateIPLMatches()
    .then(() => {
        console.log('Seeding completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error during seeding:', error);
        process.exit(1);
    });
