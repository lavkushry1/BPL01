
import { knex } from 'knex';
import config from '../config';

async function inspectSchema() {
  console.log('Connecting to database...');
  console.log(`URL: ${config.db.url || 'env var not set'}`);
  console.log(`Host: ${config.db.host}, User: ${config.db.user}, DB: ${config.db.database}`);

  const db = knex({
    client: 'pg',
    connection: config.db,
  });

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
