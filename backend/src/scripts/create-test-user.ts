import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('Password123', 12);

    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'USER', // Matches the enum case in Prisma schema
        verified: true
      }
    });

    console.log('Test user created successfully:');
    console.log({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
