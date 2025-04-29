import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('booking_payments', (table) => {
    table.uuid('id').primary();
    table.uuid('booking_id').references('id').inTable('bookings');
    table.decimal('amount', 15, 2).notNullable();
    table.string('payment_status').notNullable();
    table.string('transaction_id').nullable();
    table.string('utr_number').nullable();
    table.timestamp('verified_at').nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('booking_payments');
}
