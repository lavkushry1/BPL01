import { Knex } from 'knex';

/**
 * Migration to create reservation_expiry_queue table
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('reservation_expiry_queue', (table) => {
    table.uuid('id').primary();
    table.uuid('reservation_id').notNullable().references('id').inTable('seat_reservations');
    table.uuid('user_id').notNullable();
    table.jsonb('seat_ids').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    // Add index for efficiently finding expired reservations
    table.index('expires_at');
    table.index('reservation_id');
  });
}

/**
 * Migration to drop reservation_expiry_queue table
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('reservation_expiry_queue');
}