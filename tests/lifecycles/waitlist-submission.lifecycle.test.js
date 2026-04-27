'use strict';

// Feature: waitlist-submission lifecycle validation
//   As the public-facing waitlist endpoint
//   I want every create/update payload validated server-side
//   So that consent, structured cities, and field length caps are enforced
//   before any row is persisted.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

// @strapi/utils is a Strapi runtime dep — not installed in the bare test env.
// Inject a minimal stub into require.cache before loading the lifecycle.
class ValidationError extends Error {
  constructor(msg) { super(msg); this.name = 'ValidationError'; }
}

const UTILS_MOCK_ID = '__strapi_utils_mock_waitlist__';
require.cache[UTILS_MOCK_ID] = {
  id: UTILS_MOCK_ID, filename: UTILS_MOCK_ID, loaded: true,
  exports: { errors: { ValidationError } },
};

const _origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === '@strapi/utils') return UTILS_MOCK_ID;
  return _origResolve.call(this, request, parent, isMain, options);
};

const LIFECYCLE_PATH = path.resolve(
  __dirname,
  '../../src/api/waitlist-submission/content-types/waitlist-submission/lifecycles.js'
);

const hooks = require(LIFECYCLE_PATH);

const VALID_VERSION = '2026-04-27';

function nowIso(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function validPayload(overrides = {}) {
  return {
    name: 'Ion Popescu',
    email: 'ion@example.com',
    role: 'expeditor',
    cities: ['Luxembourg', 'Chișinău'],
    gdprConsent: true,
    gdprConsentAt: nowIso(-1000),
    gdprConsentVersion: VALID_VERSION,
    ...overrides,
  };
}

function event(data) {
  return { params: { data } };
}

describe('Feature: waitlist-submission lifecycle (beforeCreate)', () => {
  describe('Scenario: a complete v2 payload', () => {
    it('Given a valid payload, When beforeCreate runs, Then it does not throw', () => {
      assert.doesNotThrow(() => hooks.beforeCreate(event(validPayload())));
    });

    it('Given the minimum cities (length 1), Then it is accepted', () => {
      assert.doesNotThrow(() => hooks.beforeCreate(event(validPayload({ cities: ['Berlin'] }))));
    });

    it('Given the maximum cities (length 10), Then it is accepted', () => {
      const cities = Array.from({ length: 10 }, (_, i) => `City ${i + 1}`);
      assert.doesNotThrow(() => hooks.beforeCreate(event(validPayload({ cities }))));
    });
  });

  describe('Scenario: name validation', () => {
    it('Given a name of only whitespace, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ name: '   ' }))),
        { name: 'ValidationError' });
    });

    it('Given a name longer than 200 chars, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ name: 'a'.repeat(201) }))),
        { name: 'ValidationError' });
    });
  });

  describe('Scenario: cities validation', () => {
    it('Given cities is not an array, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ cities: 'Berlin' }))),
        { name: 'ValidationError' });
    });

    it('Given cities is an empty array, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ cities: [] }))),
        { name: 'ValidationError' });
    });

    it('Given cities has 11 entries, Then beforeCreate rejects it', () => {
      const cities = Array.from({ length: 11 }, (_, i) => `City ${i}`);
      assert.throws(() => hooks.beforeCreate(event(validPayload({ cities }))),
        { name: 'ValidationError' });
    });

    it('Given a city entry is empty after trim, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ cities: ['Berlin', '  '] }))),
        { name: 'ValidationError' });
    });

    it('Given a city entry exceeds 120 chars, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ cities: ['x'.repeat(121)] }))),
        { name: 'ValidationError' });
    });

    it('Given cities is omitted, Then beforeCreate accepts the payload (frontend enforces presence)', () => {
      const p = validPayload();
      delete p.cities;
      assert.doesNotThrow(() => hooks.beforeCreate(event(p)));
    });
  });

  describe('Scenario: whatsapp validation (existing rule preserved)', () => {
    it('Given a malformed whatsapp number, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ whatsapp: '352621' }))),
        { name: 'ValidationError' });
    });

    it('Given a well-formed whatsapp number, Then beforeCreate accepts it', () => {
      assert.doesNotThrow(() => hooks.beforeCreate(event(validPayload({ whatsapp: '+352 621 123 456' }))));
    });
  });

  describe('Scenario: gdprConsent must be true', () => {
    it('Given gdprConsent is false, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ gdprConsent: false }))),
        { name: 'ValidationError' });
    });

    it('Given gdprConsent is missing, Then beforeCreate rejects it', () => {
      const p = validPayload();
      delete p.gdprConsent;
      assert.throws(() => hooks.beforeCreate(event(p)), { name: 'ValidationError' });
    });
  });

  describe('Scenario: gdprConsentAt freshness', () => {
    it('Given gdprConsentAt is missing, Then beforeCreate rejects it', () => {
      const p = validPayload();
      delete p.gdprConsentAt;
      assert.throws(() => hooks.beforeCreate(event(p)), { name: 'ValidationError' });
    });

    it('Given gdprConsentAt is unparseable, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ gdprConsentAt: 'not-a-date' }))),
        { name: 'ValidationError' });
    });

    it('Given gdprConsentAt is in the future, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ gdprConsentAt: nowIso(60_000) }))),
        { name: 'ValidationError' });
    });

    it('Given gdprConsentAt is older than 1 hour, Then beforeCreate rejects it', () => {
      assert.throws(
        () => hooks.beforeCreate(event(validPayload({ gdprConsentAt: nowIso(-2 * 60 * 60 * 1000) }))),
        { name: 'ValidationError' }
      );
    });
  });

  describe('Scenario: gdprConsentVersion shape', () => {
    it('Given gdprConsentVersion is missing, Then beforeCreate rejects it', () => {
      const p = validPayload();
      delete p.gdprConsentVersion;
      assert.throws(() => hooks.beforeCreate(event(p)), { name: 'ValidationError' });
    });

    it('Given gdprConsentVersion is empty, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ gdprConsentVersion: '   ' }))),
        { name: 'ValidationError' });
    });

    it('Given gdprConsentVersion exceeds 64 chars, Then beforeCreate rejects it', () => {
      assert.throws(() => hooks.beforeCreate(event(validPayload({ gdprConsentVersion: 'v'.repeat(65) }))),
        { name: 'ValidationError' });
    });
  });
});

describe('Feature: waitlist-submission lifecycle (beforeUpdate)', () => {
  describe('Scenario: consent fields are immutable', () => {
    it('Given a partial update without consent fields, Then beforeUpdate accepts it', () => {
      assert.doesNotThrow(() => hooks.beforeUpdate(event({ name: 'Updated Name' })));
    });

    it('Given an update payload includes gdprConsent, Then beforeUpdate rejects it', () => {
      assert.throws(() => hooks.beforeUpdate(event({ gdprConsent: true })),
        { name: 'ValidationError' });
    });

    it('Given an update payload includes gdprConsentAt, Then beforeUpdate rejects it', () => {
      assert.throws(() => hooks.beforeUpdate(event({ gdprConsentAt: nowIso(-1000) })),
        { name: 'ValidationError' });
    });

    it('Given an update payload includes gdprConsentVersion, Then beforeUpdate rejects it', () => {
      assert.throws(() => hooks.beforeUpdate(event({ gdprConsentVersion: 'v2' })),
        { name: 'ValidationError' });
    });
  });

  describe('Scenario: whatsapp / cities / name still validated on update', () => {
    it('Given an update with malformed whatsapp, Then beforeUpdate rejects it', () => {
      assert.throws(() => hooks.beforeUpdate(event({ whatsapp: 'nope' })),
        { name: 'ValidationError' });
    });

    it('Given an update with malformed cities, Then beforeUpdate rejects it', () => {
      assert.throws(() => hooks.beforeUpdate(event({ cities: [] })),
        { name: 'ValidationError' });
    });

    it('Given an update with empty name, Then beforeUpdate rejects it', () => {
      assert.throws(() => hooks.beforeUpdate(event({ name: '   ' })),
        { name: 'ValidationError' });
    });
  });
});
