'use strict';

// Feature: build the Strapi document payload for an editorial single type
//   Pure mapping (manifest entry + markdown) -> Document Service data.
//   Keeps the seed script's decision logic testable without Strapi.

const { test } = require('node:test');
const path = require('node:path');

const { buildEditorialEntry } = require(path.resolve(
  __dirname,
  '../../scripts/lib/editorial-entry.js'
));

const ENTRY = {
  contentType: 'page-termeni',
  uid: 'api::page-termeni.page-termeni',
  title: 'Termeni și condiții',
  lastUpdated: '2026-05-14',
  seo: { metaTitle: 'Termeni și condiții', metaDescription: 'desc' },
};

test('maps title/lastUpdated/seo through and converts markdown body to blocks', (t) => {
  const data = buildEditorialEntry(ENTRY, '## Salut\n\nUn paragraf.');
  t.assert.strictEqual(data.title, 'Termeni și condiții');
  t.assert.strictEqual(data.lastUpdated, '2026-05-14');
  t.assert.deepStrictEqual(data.seo, ENTRY.seo);
  t.assert.strictEqual(data.body[0].type, 'heading');
  t.assert.strictEqual(data.body[1].type, 'paragraph');
});

test('throws on empty body so we never publish a blank legal page', (t) => {
  t.assert.throws(() => buildEditorialEntry(ENTRY, '   '), /empty body/i);
});
