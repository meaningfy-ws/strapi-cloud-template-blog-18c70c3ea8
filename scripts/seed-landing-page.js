'use strict';

/**
 * Seed the hulubul.com landing-page single type and configure public
 * permissions for the landing-page (read) and waitlist-submission (create).
 *
 * Usage:
 *   npm run seed:landing-page
 *
 * Safe to re-run — the single type is upserted (not duplicated) via the
 * Document Service API. Existing waitlist submissions are never touched.
 */

const landingPageData = require('../data/landing-page.json');

const LANDING_PAGE_UID = 'api::landing-page.landing-page';
const WAITLIST_UID = 'api::waitlist-submission.waitlist-submission';

async function setPublicPermissions(strapi, permissions) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole) {
    throw new Error('Public role not found — is users-permissions plugin installed?');
  }

  const toCreate = [];
  for (const [contentType, actions] of Object.entries(permissions)) {
    for (const action of actions) {
      const actionId = `api::${contentType}.${contentType}.${action}`;
      const existing = await strapi.query('plugin::users-permissions.permission').findOne({
        where: { action: actionId, role: publicRole.id },
      });
      if (!existing) {
        toCreate.push(
          strapi.query('plugin::users-permissions.permission').create({
            data: { action: actionId, role: publicRole.id },
          })
        );
      }
    }
  }

  await Promise.all(toCreate);
}

async function upsertLandingPage(strapi) {
  await strapi.documents(LANDING_PAGE_UID).update({
    documentId: undefined,
    data: landingPageData,
    status: 'published',
  });
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  try {
    console.log('Seeding landing page...');
    await upsertLandingPage(app);

    console.log('Configuring public permissions...');
    await setPublicPermissions(app, {
      'landing-page': ['find'],
      'waitlist-submission': ['create'],
    });

    console.log('Done.');
  } catch (error) {
    console.error('Seed failed:', error);
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
