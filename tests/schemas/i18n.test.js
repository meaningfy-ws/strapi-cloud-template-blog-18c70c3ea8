'use strict';

// Feature: localization-ready content types
//   As a future multilingual hulubul.com
//   I want the editorially-owned content types flagged i18n-localized
//   So that locales can be added in the Strapi UI later without a schema migration.
//
// Decision (locked): schema-ready only — localized:true, default locale only,
// no extra locales seeded in code.

const { test } = require('node:test');
const { loadContentType } = require('../helpers/schema');

const LOCALIZED_TYPES = [
  'landing-page',
  'page-confidentialitate',
  'page-termeni',
  'page-despre-proiect',
  'page-pentru-transportatori',
];

for (const apiName of LOCALIZED_TYPES) {
  test(`${apiName} is i18n-localized (pluginOptions.i18n.localized === true)`, (t) => {
    const schema = loadContentType(apiName);
    t.assert.ok(schema.pluginOptions, `${apiName}: pluginOptions missing`);
    t.assert.ok(schema.pluginOptions.i18n, `${apiName}: pluginOptions.i18n missing`);
    t.assert.strictEqual(
      schema.pluginOptions.i18n.localized,
      true,
      `${apiName}: pluginOptions.i18n.localized must be true`
    );
  });
}

test('waitlist-submission is NOT localized (operational data, single locale)', (t) => {
  const schema = loadContentType('waitlist-submission');
  const i18n = schema.pluginOptions && schema.pluginOptions.i18n;
  t.assert.ok(
    !i18n || i18n.localized !== true,
    'waitlist-submission must not be localized'
  );
});
