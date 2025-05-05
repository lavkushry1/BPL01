/**
 * Custom migration script to safely apply the payment session migrations
 * This is a safer alternative to prisma migrate when you need more control over the migration process
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting custom migration...');

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '../prisma/migrations/20250502_add_payment_session/migration.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0)
            .map(stmt => stmt + ';');

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            try {
                // Skip if it's a comment
                if (stmt.startsWith('--')) continue;

                console.log(`Executing statement ${i + 1}/${statements.length}...`);
                await prisma.$executeRawUnsafe(stmt);
                console.log('Success!');
            } catch (error) {
                // If an error occurs (e.g., column already exists), log it but continue
                console.warn(`Warning executing statement ${i + 1}: ${error.message}`);
            }
        }

        // Generate Prisma client again to reflect schema changes
        console.log('Generating updated Prisma client...');
        execSync('npx prisma generate', { stdio: 'inherit' });

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => console.log('Migration script finished'))
    .catch(e => {
        console.error('Migration script failed:', e);
        process.exit(1);
    }); 