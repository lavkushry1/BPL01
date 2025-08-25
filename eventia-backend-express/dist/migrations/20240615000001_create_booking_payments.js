"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    await knex.schema.dropTableIfExists('booking_payments');
}
//# sourceMappingURL=20240615000001_create_booking_payments.js.map