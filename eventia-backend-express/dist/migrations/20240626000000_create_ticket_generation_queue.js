"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
/**
 * Migration to create ticket_generation_queue table
 */
async function up(knex) {
    return knex.schema.createTable('ticket_generation_queue', (table) => {
        table.uuid('id').primary();
        table.uuid('booking_id').notNullable().unique();
        table.uuid('admin_id').notNullable();
        table.integer('attempts').notNullable().defaultTo(0);
        table.integer('max_attempts').notNullable().defaultTo(5);
        table.timestamp('next_attempt_at').notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('last_attempt_at').nullable();
        table.text('last_error').nullable();
        // Add index for efficiently finding tickets due for retry
        table.index('next_attempt_at');
        table.index('booking_id');
    });
}
/**
 * Migration to drop ticket_generation_queue table
 */
async function down(knex) {
    return knex.schema.dropTable('ticket_generation_queue');
}
//# sourceMappingURL=20240626000000_create_ticket_generation_queue.js.map