'use strict';

// Feature: editorial single types backing the static legal/info pages
//   As the hulubul.com frontend
//   I want each editorial page available as a published Strapi single type
//   So that editors control title/body/lastUpdated/SEO instead of the
//   build-time static fallback (lib/editorial-fallback.ts).
//
// Frontend EditorialPage contract: { title, body, lastUpdated } + own SEO meta.
// Decisions (locked): body is Strapi 5 rich-text "blocks"; i18n-ready.

const { test } = require('node:test');
const { loadContentType, assertAttribute, assertComponentAttribute } = require('../helpers/schema');

const EDITORIAL_PAGES = [
  'page-confidentialitate',
  'page-termeni',
  'page-despre-proiect',
  'page-pentru-transportatori',
];

for (const apiName of EDITORIAL_PAGES) {
  test(`${apiName} is a draft/publish single type with the EditorialPage shape`, (t) => {
    const schema = loadContentType(apiName);

    t.assert.strictEqual(schema.kind, 'singleType', `${apiName}: must be a singleType`);
    t.assert.strictEqual(schema.info.singularName, apiName);
    t.assert.strictEqual(schema.options.draftAndPublish, true, `${apiName}: draftAndPublish must be true`);

    assertAttribute(t, schema, 'title', { type: 'string', required: true });
    assertAttribute(t, schema, 'body', { type: 'blocks', required: true });
    assertAttribute(t, schema, 'lastUpdated', { type: 'date', required: true });
    assertComponentAttribute(t, schema, 'seo', 'shared.seo', { required: true });
  });
}
