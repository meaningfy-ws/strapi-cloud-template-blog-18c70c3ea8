'use strict';

// Feature: editorial-pages seed conforms to the page-* contract
//   Mirrors tests/seed/landing-page-seed.test.js: the seed manifest + md
//   bodies must satisfy each page-* single type's required attributes once
//   markdown is converted to Blocks.

const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const { REPO_ROOT, loadContentType } = require('../helpers/schema');
const { markdownToBlocks } = require(path.join(
  REPO_ROOT,
  'scripts/lib/markdown-to-blocks.js'
));

const manifest = require(path.join(REPO_ROOT, 'data/editorial-pages.json'));

const EXPECTED = {
  'page-confidentialitate': '2026-04-23',
  'page-termeni': '2026-05-14',
  'page-despre-proiect': '2026-05-14',
  'page-pentru-transportatori': '2026-05-14',
};
const KNOWN_BLOCKS = new Set(['paragraph', 'heading', 'list']);

test('manifest covers exactly the 4 editorial single types', (t) => {
  t.assert.deepStrictEqual(
    manifest.map((e) => e.contentType).sort(),
    Object.keys(EXPECTED).sort()
  );
});

for (const ct of Object.keys(EXPECTED)) {
  test(`${ct}: entry satisfies the schema's required attributes`, (t) => {
    const entry = manifest.find((e) => e.contentType === ct);
    t.assert.ok(entry, `${ct}: missing manifest entry`);

    // lastUpdated: ISO date, matches the source page
    t.assert.match(entry.lastUpdated, /^\d{4}-\d{2}-\d{2}$/);
    t.assert.strictEqual(entry.lastUpdated, EXPECTED[ct]);

    // seo: required metaTitle/metaDescription; metaTitle un-branded
    t.assert.ok(entry.seo.metaTitle && entry.seo.metaTitle.trim().length > 0);
    t.assert.ok(
      !/hulubul\.com/i.test(entry.seo.metaTitle),
      `${ct}: metaTitle must NOT carry the brand suffix (frontend brands it)`
    );
    t.assert.ok(
      entry.seo.metaDescription && entry.seo.metaDescription.trim().length > 0
    );

    // title required
    t.assert.ok(entry.title && entry.title.trim().length > 0);

    // body: md file exists, converts to a non-empty valid Blocks array
    const md = fs.readFileSync(path.join(REPO_ROOT, entry.bodyFile), 'utf8');
    const blocks = markdownToBlocks(md);
    t.assert.ok(Array.isArray(blocks) && blocks.length > 0);
    for (const b of blocks) {
      t.assert.ok(KNOWN_BLOCKS.has(b.type), `unexpected block type: ${b.type}`);
      t.assert.ok(Array.isArray(b.children) && b.children.length > 0);
    }

    // schema sanity: the content type really requires these attrs
    const schema = loadContentType(ct);
    for (const req of ['title', 'body', 'lastUpdated', 'seo']) {
      t.assert.ok(schema.attributes[req].required, `${ct}.${req} should be required`);
    }
  });
}
