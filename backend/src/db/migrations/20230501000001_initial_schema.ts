
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.enum('role', ['admin', 'user']).defaultTo('user').notNullable();
    table.timestamps(true, true);
  });

  // Events table
  await knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description').nullable();
    table.string('location').notNullable();
    table.timestamp('start_date').notNullable();
    table.timestamp('end_date').nullable();
    table.string('image_url').nullable();
    table.integer('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.boolean('is_published').defaultTo(false).notNullable();
    table.timestamps(true, true);
  });

  // Stadiums table
  await knex.schema.createTable('stadiums', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('location').notNullable();
    table.integer('capacity').unsigned().notNullable();
    table.text('seating_map').nullable(); // JSON schema for seating map
    table.timestamps(true, true);
  });

  // Teams table
  await knex.schema.createTable('teams', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('logo_url').nullable();
    table.string('short_name', 3).notNullable();
    table.timestamps(true, true);
  });

  // Event Teams mapping (for events with teams, like sports)
  await knex.schema.createTable('event_teams', (table) => {
    table.increments('id').primary();
    table.integer('event_id').references('id').inTable('events').onDelete('CASCADE').notNullable();
    table.integer('team_id').references('id').inTable('teams').onDelete('CASCADE').notNullable();
    table.enum('role', ['home', 'away']).notNullable();
    table.unique(['event_id', 'team_id']);
    table.timestamps(true, true);
  });

  // Event Stadium mapping
  await knex.schema.createTable('event_stadiums', (table) => {
    table.increments('id').primary();
    table.integer('event_id').references('id').inTable('events').onDelete('CASCADE').notNullable();
    table.integer('stadium_id').references('id').inTable('stadiums').onDelete('CASCADE').notNullable();
    table.unique(['event_id', 'stadium_id']);
    table.timestamps(true, true);
  });

  // Seats categories (like VIP, General, etc)
  await knex.schema.createTable('seat_categories', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('color').notNullable();
    table.text('description').nullable();
    table.timestamps(true, true);
  });

  // Stadium sections
  await knex.schema.createTable('stadium_sections', (table) => {
    table.increments('id').primary();
    table.integer('stadium_id').references('id').inTable('stadiums').onDelete('CASCADE').notNullable();
    table.string('name').notNullable();
    table.integer('category_id').references('id').inTable('seat_categories').onDelete('SET NULL');
    table.timestamps(true, true);
  });

  // Seats
  await knex.schema.createTable('seats', (table) => {
    table.increments('id').primary();
    table.integer('section_id').references('id').inTable('stadium_sections').onDelete('CASCADE').notNullable();
    table.string('row').notNullable();
    table.string('number').notNullable();
    table.unique(['section_id', 'row', 'number']);
    table.timestamps(true, true);
  });

  // Bookings
  await knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.integer('event_id').references('id').inTable('events').onDelete('CASCADE').notNullable();
    table.enum('status', ['pending', 'confirmed', 'cancelled']).defaultTo('pending').notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('booking_reference').unique().notNullable();
    table.timestamps(true, true);
  });

  // Booking seats
  await knex.schema.createTable('booking_seats', (table) => {
    table.increments('id').primary();
    table.integer('booking_id').references('id').inTable('bookings').onDelete('CASCADE').notNullable();
    table.integer('seat_id').references('id').inTable('seats').onDelete('CASCADE').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.unique(['booking_id', 'seat_id']);
    table.timestamps(true, true);
  });

  // Discounts
  await knex.schema.createTable('discounts', (table) => {
    table.increments('id').primary();
    table.string('code').unique().notNullable();
    table.decimal('percentage', 5, 2).nullable();
    table.decimal('fixed_amount', 10, 2).nullable();
    table.timestamp('valid_from').notNullable();
    table.timestamp('valid_until').nullable();
    table.integer('max_uses').nullable();
    table.integer('uses_count').defaultTo(0).notNullable();
    table.boolean('is_active').defaultTo(true).notNullable();
    table.timestamps(true, true);
  });

  // Payments
  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table.integer('booking_id').references('id').inTable('bookings').onDelete('CASCADE').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending').notNullable();
    table.string('payment_method').notNullable();
    table.string('transaction_id').unique().nullable();
    table.string('utr_number').unique().nullable(); // For UPI payments
    table.jsonb('payment_details').nullable();
    table.timestamps(true, true);
  });

  // UPI settings
  await knex.schema.createTable('payment_settings', (table) => {
    table.increments('id').primary();
    table.string('merchant_name').notNullable();
    table.string('upi_vpa').notNullable();
    table.boolean('is_active').defaultTo(true).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to avoid foreign key constraints
  await knex.schema.dropTableIfExists('payment_settings');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('discounts');
  await knex.schema.dropTableIfExists('booking_seats');
  await knex.schema.dropTableIfExists('bookings');
  await knex.schema.dropTableIfExists('seats');
  await knex.schema.dropTableIfExists('stadium_sections');
  await knex.schema.dropTableIfExists('seat_categories');
  await knex.schema.dropTableIfExists('event_stadiums');
  await knex.schema.dropTableIfExists('event_teams');
  await knex.schema.dropTableIfExists('teams');
  await knex.schema.dropTableIfExists('stadiums');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('users');
}
