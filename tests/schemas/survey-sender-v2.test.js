'use strict';

// Feature: survey-sender-v2 content-type schema
//   As the backend operator
//   I want a new collection sibling to survey-sender
//   So that the frontend's v2 sender questionnaire
//   (hulubul-front/lib/survey-schema-v2.ts) can persist responses
//   without touching the existing survey-sender collection or its data.

const { describe, it } = require('node:test');
const { loadContentType, assertAttribute } = require('../helpers/schema');

describe('survey-sender-v2 schema', () => {
  const schema = loadContentType('survey-sender-v2');

  describe('Scenario: collection metadata', () => {
    it('Given the schema is loaded, Then it is a non-draftable collection type', (t) => {
      t.assert.strictEqual(schema.kind, 'collectionType');
      t.assert.strictEqual(schema.info.singularName, 'survey-sender-v2');
      t.assert.strictEqual(schema.info.pluralName, 'survey-sender-v2s');
      t.assert.strictEqual(schema.options.draftAndPublish, false);
    });
  });

  describe('Scenario: identity fields', () => {
    it('Given the schema, Then name is a required string capped at 200 chars', (t) => {
      assertAttribute(t, schema, 'name', { type: 'string', required: true, maxLength: 200 });
    });

    it('And email is a required email field', (t) => {
      assertAttribute(t, schema, 'email', { type: 'email', required: true });
    });
  });

  describe('Scenario: structured two-city route', () => {
    it('Given the schema, Then routeCities is a required JSON field', (t) => {
      assertAttribute(t, schema, 'routeCities', { type: 'json', required: true });
    });
  });

  describe('Scenario: required single-choice enums', () => {
    it('Given the schema, Then sendingFrequency has the canonical 5 values', (t) => {
      const attr = schema.attributes.sendingFrequency;
      t.assert.strictEqual(attr.type, 'enumeration');
      t.assert.strictEqual(attr.required, true);
      t.assert.deepStrictEqual(attr.enum, [
        'niciodata',
        'rar',
        'cateva_ori_pe_an',
        'la_2_3_luni',
        'lunar_sau_mai_des',
      ]);
    });

    it('And searchDuration is a required string, NOT a Strapi enumeration', (t) => {
      // Strapi's content-type validator (@strapi/core) rejects enumeration
      // values that don't have a letter before their first digit (GraphQL
      // enum-naming rule, unconditional — see design.md's Decisions). Three
      // of the frontend's canonical values (5_15_min, 15_30_min, 30_60_min)
      // violate that, so this field is a plain string; the canonical value
      // set below is documentation/contract only, not schema-enforced.
      assertAttribute(t, schema, 'searchDuration', { type: 'string', required: true });
      const canonicalValues = [
        'sub_5_min',
        '5_15_min',
        '15_30_min',
        '30_60_min',
        'cateva_ore',
        'o_zi_sau_mai_mult',
        'nu_se_aplica',
      ];
      t.assert.strictEqual(canonicalValues.length, 7);
    });

    it('And wantsToTest has the canonical 3 values', (t) => {
      const attr = schema.attributes.wantsToTest;
      t.assert.strictEqual(attr.type, 'enumeration');
      t.assert.strictEqual(attr.required, true);
      t.assert.deepStrictEqual(attr.enum, ['da', 'posibil', 'nu']);
    });
  });

  describe('Scenario: multi-select fields with an Other companion', () => {
    const cases = [
      ['howFindTransporter', [
        'transportator_cunoscut',
        'recomandare_prieteni',
        'facebook',
        'whatsapp_telegram',
        'google_site',
        'nu_am_trimis',
        'altcineva_organizeaza',
        'altceva',
      ]],
      ['difficulties', [
        'nu_gasesc_rapid',
        'nu_primesc_raspuns',
        'repet_informatii',
        'nu_e_de_incredere',
        'pret_neclar',
        'intarzieri_preluare_livrare',
        'fara_informatii_status',
        'altceva',
      ]],
      ['decisionCriteria', [
        'siguranta',
        'pretul',
        'rapiditatea',
        'disponibilitatea',
        'reputatia',
        'l_am_mai_folosit',
        'comunicarea',
        'altceva',
      ]],
      ['trustSignals', [
        'recomandare_cunoscut',
        'transportator_verificat',
        'recenzii_reale',
        'pret_clar',
        'tracking_confirmare',
        'suport_problema',
        'altceva',
      ]],
      ['switchReasons', [
        'prefer_mesaje',
        'o_singura_cerere',
        'ajunge_la_relevanti',
        'alternative_automate',
        'compar_usor',
        'tracking_notificari',
        'nimic_prefer_direct',
        'altceva',
      ]],
    ];

    for (const [field, enumValues] of cases) {
      it(`Given the schema, Then ${field} is a required JSON array field`, (t) => {
        assertAttribute(t, schema, field, { type: 'json', required: true });
        // enum values live in the spec/design, not enforceable via JSON schema —
        // documented here as the contract this field's array entries must satisfy.
        t.assert.ok(Array.isArray(enumValues) && enumValues.includes('altceva'));
      });

      it(`And ${field}Other is an optional text field`, (t) => {
        assertAttribute(t, schema, `${field}Other`, { type: 'text', required: false });
      });
    }
  });

  describe('Scenario: no server-side maximum on multi-select selection counts', () => {
    // Policy (openspec change survey-sender-v2-permissive-choice-limits): the backend
    // never caps how many options are ticked, even where the frontend's own Zod schema
    // caps at 3 (difficulties, decisionCriteria, trustSignals, switchReasons). Only the
    // frontend enforces a limit. This guards against someone later adding a
    // beforeCreate/beforeUpdate length check to survey-sender-v2's (currently
    // nonexistent) lifecycle file.
    const cappedFields = ['difficulties', 'decisionCriteria', 'trustSignals', 'switchReasons'];

    for (const field of cappedFields) {
      it(`Given the schema, Then ${field} carries no maxItems/length-limiting property`, (t) => {
        const attr = schema.attributes[field];
        t.assert.strictEqual(attr.type, 'json');
        t.assert.strictEqual(attr.maxItems, undefined, `${field} must not declare maxItems`);
        t.assert.strictEqual(attr.max, undefined, `${field} must not declare max`);
      });
    }

    it('And a selection count above the frontend\'s documented cap (3) still fits the schema shape', (t) => {
      const overCapSelection = [
        'nu_gasesc_rapid',
        'nu_primesc_raspuns',
        'repet_informatii',
        'nu_e_de_incredere',
        'pret_neclar',
      ];
      t.assert.ok(overCapSelection.length > 3, 'fixture must exceed the frontend cap to be meaningful');
      const attr = schema.attributes.difficulties;
      t.assert.strictEqual(attr.type, 'json');
      t.assert.strictEqual(attr.maxItems, undefined);
    });
  });

  describe('Scenario: free-text summary field', () => {
    it('Given the schema, Then mostImportantThing is a required text field', (t) => {
      assertAttribute(t, schema, 'mostImportantThing', { type: 'text', required: true });
    });
  });

  describe('Scenario: Alpha-test opt-in fields are optional and unenforced server-side', () => {
    it('Given the schema, Then testPhone is an optional string', (t) => {
      assertAttribute(t, schema, 'testPhone', { type: 'string', required: false });
    });

    it('And testConsent is an optional boolean', (t) => {
      assertAttribute(t, schema, 'testConsent', { type: 'boolean', required: false });
    });
  });

  describe('Scenario: no relation to consent-record (unlike survey-sender)', () => {
    it('Given the schema, Then it has no consentRecord attribute', (t) => {
      t.assert.strictEqual(schema.attributes.consentRecord, undefined);
    });
  });

  describe('Scenario: optional approximate location capture', () => {
    it('Given the schema, Then location is an optional JSON field', (t) => {
      assertAttribute(t, schema, 'location', { type: 'json', required: false });
    });

    it('And there is no locationConsent attribute (silent capture, no consent UI)', (t) => {
      t.assert.strictEqual(schema.attributes.locationConsent, undefined);
    });
  });
});
