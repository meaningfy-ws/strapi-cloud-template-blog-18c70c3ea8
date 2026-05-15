'use strict';

/**
 * Indexes for the frontend soft-dedupe pre-check (PR #16).
 *
 * findWaitlistByEmail() issues
 *   GET /api/waitlist-submissions?filters[email][$eqi]=…&sort=createdAt
 * on every submit. Without these indexes that is a full table scan per
 * submission. Portable across the sqlite (dev) and postgres (prod) clients
 * configured in config/database.js.
 */

const TABLE = 'waitlist_submissions';
const EMAIL_INDEX = 'idx_waitlist_submissions_email';
const CREATED_AT_INDEX = 'idx_waitlist_submissions_created_at';

async function up(knex) {
  if (!(await knex.schema.hasTable(TABLE))) return;
  await knex.schema.alterTable(TABLE, (table) => {
    table.index(['email'], EMAIL_INDEX);
    table.index(['created_at'], CREATED_AT_INDEX);
  });
}

async function down(knex) {
  if (!(await knex.schema.hasTable(TABLE))) return;
  await knex.schema.alterTable(TABLE, (table) => {
    table.dropIndex(['email'], EMAIL_INDEX);
    table.dropIndex(['created_at'], CREATED_AT_INDEX);
  });
}

module.exports = { up, down };
