
const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'lavkushkumar',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'eventia_test',
};

async function fixDatabase() {
  console.log('Connecting to database...', config.host, config.database);
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Connected.');

    // Add locked_by column
    console.log('Adding locked_by column...');
    await client.query(`
      ALTER TABLE seats
      ADD COLUMN IF NOT EXISTS locked_by VARCHAR(255);
    `);

    // Add lock_expires_at column
    console.log('Adding lock_expires_at column...');
    await client.query(`
      ALTER TABLE seats
      ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMP WITH TIME ZONE;
    `);

    // Check if bookings column id exists (just verifying, not fixing here as it's likely a logic issue fixed in code)

    console.log('Database fix applied successfully!');
  } catch (err) {
    console.error('Error fixing database:', err);
  } finally {
    await client.end();
  }
}

fixDatabase();
