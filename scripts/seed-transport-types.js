'use strict';

/**
 * Seed the initial transport-type lookup records defined in the spec.
 * Safe to re-run — each record is only created if its slug does not yet exist.
 *
 * Usage:
 *   npm run seed:transport-types
 */

const TRANSPORT_TYPE_UID = 'api::transport-type.transport-type';

const INITIAL_TYPES = [
  {
    label: 'Colete & pachete',
    slug: 'colete-pachete',
    description: 'Pachete mici și medii, sub 30 kg',
  },
  {
    label: 'Transport persoane',
    slug: 'transport-persoane',
    description: 'Locuri disponibile în mașină pe rută',
  },
  {
    label: 'Marfă voluminoasă',
    slug: 'marfa-voluminoasa',
    description: 'Mobilă, electrocasnice, mărfuri mari',
  },
  {
    label: 'Automobile',
    slug: 'automobile',
    description: 'Transport autoturisme pe platformă sau conduse',
  },
];

async function seedTransportTypes(strapi) {
  for (const entry of INITIAL_TYPES) {
    const existing = await strapi.documents(TRANSPORT_TYPE_UID).findFirst({
      filters: { slug: entry.slug },
    });

    if (existing) {
      console.log(`  skip     ${entry.slug} (already exists)`);
    } else {
      await strapi.documents(TRANSPORT_TYPE_UID).create({ data: entry });
      console.log(`  created  ${entry.slug}`);
    }
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  try {
    console.log('Seeding transport types...');
    await seedTransportTypes(app);
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
