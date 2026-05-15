'use strict';

// Feature: codified permission contract for the waitlist soft-dedupe (PR #16)
//   The frontend server call needs BOTH create (insert) and find (the
//   pre-insert $eqi dedupe lookup). Public must NEVER get find (PII: emails,
//   locations). This module centralises exactly which actions the
//   server-side waitlist caller requires, so bootstrap can grant them to a
//   non-public role idempotently.

const { test } = require('node:test');
const path = require('node:path');

const mod = require(path.resolve(
  __dirname,
  '../../src/api/waitlist-submission/permissions.js'
));

test('exposes the find + create action ids the frontend server token needs', (t) => {
  t.assert.deepStrictEqual(mod.WAITLIST_SERVER_ACTIONS.sort(), [
    'api::waitlist-submission.waitlist-submission.create',
    'api::waitlist-submission.waitlist-submission.find',
  ]);
});

test('does NOT include findOne, delete or update (least privilege)', (t) => {
  for (const a of mod.WAITLIST_SERVER_ACTIONS) {
    t.assert.ok(
      /\.(find|create)$/.test(a),
      `unexpected over-broad action: ${a}`
    );
  }
});

test('missingActions returns only the desired actions not already present (idempotent grant)', (t) => {
  const desired = mod.WAITLIST_SERVER_ACTIONS;
  t.assert.deepStrictEqual(mod.missingActions([], desired).sort(), desired.slice().sort());
  t.assert.deepStrictEqual(
    mod.missingActions(['api::waitlist-submission.waitlist-submission.create'], desired),
    ['api::waitlist-submission.waitlist-submission.find']
  );
  t.assert.deepStrictEqual(mod.missingActions(desired, desired), []);
});

test('public role permission set explicitly excludes find (PII guard)', (t) => {
  t.assert.deepStrictEqual(mod.WAITLIST_PUBLIC_ACTIONS, [
    'api::waitlist-submission.waitlist-submission.create',
  ]);
  t.assert.ok(
    !mod.WAITLIST_PUBLIC_ACTIONS.some((a) => a.endsWith('.find')),
    'public must never have find on waitlist-submission'
  );
});
