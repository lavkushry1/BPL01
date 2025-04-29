"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    await knex.schema.dropTableIfExists('bookings');
}
