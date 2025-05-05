const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration(filePath) {
    console.log(`Applying migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split SQL by semicolons to execute each statement separately
    const statements = sql.split(';').filter(statement => statement.trim() !== '');

    for (const statement of statements) {
        if (statement.trim()) {
            try {
                await prisma.$executeRawUnsafe(`${statement};`);
                console.log('Statement executed successfully');
            } catch (error) {
                console.error(`Error executing statement: ${error.message}`);
                console.error('Statement:', statement);
                // Continue with other statements
            }
        }
    }
}

async function main() {
    try {
        // Apply payment session migration if it hasn't been applied yet
        await applyMigration(path.join(__dirname, '../prisma/migrations/20250502_add_payment_session/migration.sql'));

        // Apply ticket table migration
        await applyMigration(path.join(__dirname, '../prisma/migrations/20250503_add_ticket_table/migration.sql'));

        console.log('Custom migrations applied successfully');
    } catch (error) {
        console.error('Failed to apply migrations:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 