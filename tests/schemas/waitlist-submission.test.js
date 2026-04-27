'use strict';

// Feature: waitlist-submission content-type schema
//   As the backend operator
//   I want the waitlist collection to expose every field defined in
//   design/spec-waitlist-submission.md (v2)
//   So that the Next.js handler can persist a full v2 payload
//   and historical rows remain valid during the deprecation window.

const { describe, it } = require('node:test');
const { loadContentType, assertAttribute } = require('../helpers/schema');

describe('waitlist-submission schema (v2)', () => {
  const schema = loadContentType('waitlist-submission');

  describe('Scenario: collection metadata', () => {
    it('Given the schema is loaded, Then it is a non-draftable collection type', (t) => {
      t.assert.strictEqual(schema.kind, 'collectionType');
      t.assert.strictEqual(schema.collectionName, 'waitlist_submissions');
      t.assert.strictEqual(schema.info.singularName, 'waitlist-submission');
      t.assert.strictEqual(schema.info.pluralName, 'waitlist-submissions');
      t.assert.strictEqual(schema.options.draftAndPublish, false);
    });
  });

  describe('Scenario: identity fields', () => {
    it('Given a v2 schema, Then name is a required string capped at 200 chars', (t) => {
      assertAttribute(t, schema, 'name', { type: 'string', required: true, maxLength: 200 });
    });

    it('And email is a required email field', (t) => {
      assertAttribute(t, schema, 'email', { type: 'email', required: true });
    });

    it('And whatsapp is an optional string', (t) => {
      assertAttribute(t, schema, 'whatsapp', { type: 'string', required: false });
    });
  });

  describe('Scenario: role enum (deprecation window)', () => {
    it('Given v2 is deployed, Then the enum keeps `ambele` (deprecated) and adds `destinatar`', (t) => {
      const role = schema.attributes.role;
      t.assert.strictEqual(role.type, 'enumeration');
      t.assert.deepStrictEqual(role.enum, ['expeditor', 'transportator', 'ambele', 'destinatar']);
      t.assert.strictEqual(role.required, true);
      t.assert.strictEqual(role.default, 'expeditor');
    });
  });

  describe('Scenario: structured cities replaces free-text routes', () => {
    it('Given the v2 schema, Then cities is an optional JSON field', (t) => {
      assertAttribute(t, schema, 'cities', { type: 'json', required: false });
    });

    it('And routes is demoted to optional with a 500-char cap', (t) => {
      assertAttribute(t, schema, 'routes', { type: 'string', required: false, maxLength: 500 });
    });
  });

  describe('Scenario: analytics & device signature fields', () => {
    it('Given the v2 schema, Then source defaults to "landing"', (t) => {
      const source = schema.attributes.source;
      t.assert.strictEqual(source.type, 'enumeration');
      t.assert.deepStrictEqual(source.enum, ['landing', 'qr_event', 'referral', 'other']);
      t.assert.strictEqual(source.default, 'landing');
    });

    it('And location is an optional JSON field', (t) => {
      assertAttribute(t, schema, 'location', { type: 'json', required: false });
    });

    it('And locationConsent defaults to "not_asked"', (t) => {
      const lc = schema.attributes.locationConsent;
      t.assert.strictEqual(lc.type, 'enumeration');
      t.assert.deepStrictEqual(lc.enum, ['granted', 'denied', 'not_asked']);
      t.assert.strictEqual(lc.default, 'not_asked');
    });

    it('And device is an optional JSON field', (t) => {
      assertAttribute(t, schema, 'device', { type: 'json', required: false });
    });

    it('And utm is an optional JSON field', (t) => {
      assertAttribute(t, schema, 'utm', { type: 'json', required: false });
    });
  });

  describe('Scenario: GDPR consent trio (legal record)', () => {
    it('Given the v2 schema, Then gdprConsent is a required boolean defaulting to false', (t) => {
      assertAttribute(t, schema, 'gdprConsent', { type: 'boolean', required: true, default: false });
    });

    it('And gdprConsentAt is a required datetime', (t) => {
      assertAttribute(t, schema, 'gdprConsentAt', { type: 'datetime', required: true });
    });

    it('And gdprConsentVersion is a required string capped at 64 chars', (t) => {
      assertAttribute(t, schema, 'gdprConsentVersion', { type: 'string', required: true, maxLength: 64 });
    });
  });
});
