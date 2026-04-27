'use strict';

/**
 * One-time backfill of GDPR consent fields on waitlist-submission rows
 * created before the v2 schema (2026-04-27).
 *
 * Stamps each row with:
 *   gdprConsent:        true
 *   gdprConsentAt:      row.createdAt
 *   gdprConsentVersion: "pre-2026-04-27"
 *
 * Justification: those rows were submitted under the prior privacy notice,
 * which we treat as the v0 consent text. The distinct version string lets
 * us audit them.
 *
 * Idempotent: rows that already have the consent trio set are skipped.
 *
 * Run order on production:
 *   1. Deploy schema PR with consent fields temporarily required:false.
 *   2. npm run backfill:waitlist-consent
 *   3. Deploy follow-up PR flipping consent fields to required:true.
 *
 * Usage:
 *   npm run backfill:waitlist-consent
 */

const UID = 'api::waitlist-submission.waitlist-submission';
const VERSION = 'pre-2026-04-27';

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  let updated = 0;
  let skipped = 0;

  try {
    const rows = await app.documents(UID).findMany({ pagination: { limit: -1 } });
    for (const r of rows) {
      if (r.gdprConsent === true && r.gdprConsentAt && r.gdprConsentVersion) {
        skipped++;
        continue;
      }
      await app.documents(UID).update({
        documentId: r.documentId,
        data: {
          gdprConsent: true,
          gdprConsentAt: r.createdAt,
          gdprConsentVersion: VERSION,
        },
      });
      updated++;
    }
    console.log(`Backfill done. updated=${updated} skipped=${skipped}`);
  } catch (error) {
    console.error('Backfill failed:', error);
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
