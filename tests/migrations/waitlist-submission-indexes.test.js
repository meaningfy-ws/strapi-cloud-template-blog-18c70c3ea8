'use strict';

// Feature: indexes for the soft-dedupe pre-check (frontend PR #16)
//   The new findWaitlistByEmail() runs filters[email][$eqi]=... on every
//   submit. Without indexes that is a full table scan per submission.
//   This migration adds indexes on email and created_at.

const { test } = require('node:test');
const path = require('node:path');
const fs = require('node:fs');

const MIGRATIONS_DIR = path.resolve(__dirname, '../../database/migrations');

function findMigration() {
  const file = fs
    .readdirSync(MIGRATIONS_DIR)
    .find((f) => f.endsWith('.js') && f.includes('waitlist-submission-indexes'));
  if (!file) throw new Error('waitlist-submission-indexes migration not found');
  return require(path.join(MIGRATIONS_DIR, file));
}

// Minimal fake knex that records schema-builder intent.
function fakeKnex() {
  const calls = { tablesChecked: [], indexed: [], droppedIndexes: [] };
  const tableBuilder = {
    index: (cols, name) => calls.indexed.push({ cols, name }),
    dropIndex: (cols, name) => calls.droppedIndexes.push({ cols, name }),
  };
  const knex = {
    schema: {
      hasTable: async (t) => {
        calls.tablesChecked.push(t);
        return true;
      },
      hasColumn: async () => true,
      alterTable: async (t, cb) => {
        calls.alteredTable = t;
        cb(tableBuilder);
      },
    },
  };
  return { knex, calls };
}

test('migration exports up and down functions', () => {
  const m = findMigration();
  if (typeof m.up !== 'function' || typeof m.down !== 'function') {
    throw new Error('migration must export async up(knex) and down(knex)');
  }
});

test('up() indexes waitlist_submissions on email and created_at', async (t) => {
  const m = findMigration();
  const { knex, calls } = fakeKnex();

  await m.up(knex);

  t.assert.strictEqual(calls.alteredTable, 'waitlist_submissions');
  const cols = calls.indexed.flatMap((i) => i.cols);
  t.assert.ok(cols.includes('email'), 'email index missing');
  t.assert.ok(cols.includes('created_at'), 'created_at index missing');
});

test('down() drops the same indexes (reversible)', async (t) => {
  const m = findMigration();
  const { knex, calls } = fakeKnex();

  await m.down(knex);

  const cols = calls.droppedIndexes.flatMap((i) => i.cols);
  t.assert.ok(cols.includes('email'), 'email index not dropped');
  t.assert.ok(cols.includes('created_at'), 'created_at index not dropped');
});
