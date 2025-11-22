/**
 * UPI Settings Seeder
 *
 * This script creates an active UPI setting in the database.
 * Run with: npx ts-node src/scripts/seed-upi-settings.ts
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';

async function seedUpiSettings() {
    try {
        console.log('Seeding UPI settings...');

        // Check if there's already an active UPI setting
        const existingActive = await prisma.upiSettings.findFirst({
            where: { isactive: true }
        });

        if (existingActive) {
            console.log(`Found existing active UPI setting: ${existingActive.upivpa}`);

            // Update it to use the required UPI ID if it's different
            if (existingActive.upivpa !== '9122036484@hdfc') {
                console.log(`Updating existing UPI setting to required UPI ID`);
                await prisma.upiSettings.update({
                    where: { id: existingActive.id },
                    data: {
                        upivpa: '9122036484@hdfc',
                        updated_at: new Date()
                    }
                });
                console.log('UPI setting updated successfully');
            } else {
                console.log('Existing UPI setting already has the required UPI ID');
            }
        } else {
            // Deactivate all existing settings first
            await prisma.upiSettings.updateMany({
                data: { isactive: false }
            });

            // Create a new active UPI setting with the required ID
            const newSetting = await prisma.upiSettings.create({
                data: {
                    id: uuidv4(),
                    upivpa: '9122036484@hdfc',
                    discountamount: 0,
                    isactive: true
                }
            });

            console.log(`Created new UPI setting with ID: ${newSetting.id}, UPI VPA: ${newSetting.upivpa}`);
        }

        console.log('UPI settings seeding completed successfully');
    } catch (error) {
        console.error('Error seeding UPI settings:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed function
seedUpiSettings()
    .then(() => {
        console.log('Seeding completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error in seeding process:', error);
        process.exit(1);
    });
