
const knex = require('knex').knex;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables manually since we aren't using the full app config
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'lavkushkumar',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'eventia_test',
  }
};

async function inspectSchema() {
  console.log('Connecting to database...');
  console.log(`Host: ${config.connection.host}, DB: ${config.connection.database}`);

  const db = knex(config);

  try {
    const seatsColumns = await db('information_schema.columns')
      .where({ table_name: 'seats' })
      .select('column_name', 'data_type');

    console.log('\n--- SEATS TABLE COLUMNS ---');
    console.table(seatsColumns);

    const bookingsColumns = await db('information_schema.columns')
      .where({ table_name: 'bookings' })
      .select('column_name', 'data_type');

    console.log('\n--- BOOKINGS TABLE COLUMNS ---');
    console.table(bookingsColumns);

    // Also check for locked_by variants specifically just in case
    const lockedVariants = await db('information_schema.columns')
      .where({ table_name: 'seats' })
      .where('column_name', 'like', '%locked%')
      .select('column_name');
    console.log('\n--- LOCKED COLUMN VARIANTS ---');
    console.log(lockedVariants);

  } catch (err) {
    console.error('Error inspecting schema:', err);
  } finally {
    await db.destroy();
  }
}

inspectSchema();
