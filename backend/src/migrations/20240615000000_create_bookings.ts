import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('bookings', (table) => {
    table.uuid('id').primary();
    table.uuid('event_id').references('id').inTable('events');
    table.integer('seats').notNullable();
    table.decimal('total_amount', 15, 2).notNullable();
    table.decimal('final_amount', 15, 2).notNullable();
    table.string('status').notNullable().defaultTo('pending');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('bookings');
}
