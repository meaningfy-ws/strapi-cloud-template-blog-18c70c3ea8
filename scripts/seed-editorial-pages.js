'use strict';

/**
 * Seed the 4 editorial single types (page-confidentialitate, page-termeni,
 * page-despre-proiect, page-pentru-transportatori) from data/editorial-pages
 * and publish them in the default (ro) locale.
 *
 * Usage:
 *   npm run seed:editorial-pages
 *
 * Safe to re-run — each single type is upserted (not duplicated) via the
 * Document Service API. Source copy mirrors the frontend build-time
 * fallback (lib/editorial-fallback.ts); markdown is converted to Blocks.
 *
 * Permissions are intentionally NOT touched here — the live frontend reads
 * these via a custom API token; grant `find` per docs/DEPLOY-RUNBOOK.md.
 */

const fs = require('fs-extra');
const path = require('path');

const manifest = require('../data/editorial-pages.json');
const { buildEditorialEntry } = require('./lib/editorial-entry');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_LOCALE = 'ro';

async function upsertEditorialPage(strapi, entry) {
  const markdown = fs.readFileSync(path.join(REPO_ROOT, entry.bodyFile), 'utf8');
  const data = buildEditorialEntry(entry, markdown);

  await strapi.documents(entry.uid).update({
    documentId: undefined, // single type — Strapi resolves the sole document
    locale: DEFAULT_LOCALE,
    data,
    status: 'published',
  });
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  try {
    for (const entry of manifest) {
      console.log(`Seeding ${entry.contentType}...`);
      await upsertEditorialPage(app, entry);
    }
    console.log('Done.');
  } catch (error) {
    console.error('Editorial seed failed:', error);
    process.exitCode = 1;
  } finally {
    await app.destroy();
  }

  process.exit(process.exitCode || 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
