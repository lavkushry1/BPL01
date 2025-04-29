
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create booking_payments table
  await knex.schema.createTable('booking_payments', (table) => {
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
    table.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('utr_number');
    table.timestamp('payment_date');
    table.enum('status', ['pending', 'verified', 'rejected', 'refunded']).notNullable().defaultTo('pending');
    table.uuid('verified_by').references('id').inTable('users');
    table.timestamps(true, true);
  });

  // Create upi_settings table
  await knex.schema.createTable('upi_settings', (table) => {
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
    table.string('upivpa').notNullable();
    table.decimal('discountamount', 10, 2).notNullable().defaultTo(0);
    table.boolean('isactive').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  // Create initial UPI settings
  await knex('upi_settings').insert({
    upivpa: 'default@upi',
    discountamount: 0,
    isactive: true,
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('booking_payments');
  await knex.schema.dropTableIfExists('upi_settings');
}
